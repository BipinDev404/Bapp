#!/usr/bin/env python3
import sys
import os
import io
import json
import struct
import zipfile
import hashlib
import zlib

def rebuild_axml_stringpool(manifest_bytes, package_id):
    """
    Rebuild Android Binary XML (AXML) StringPool chunk with package ID replacement.
    Maintains MainActivity class reference so Dex class loading succeeds without crash.
    """
    try:
        manifest = bytearray(manifest_bytes)
        chunk_type, header_size, chunk_size = struct.unpack_from('<HHI', manifest, 0)
        if chunk_type != 0x0003:
            return manifest_bytes
        
        sp_type, sp_header_size, sp_chunk_size = struct.unpack_from('<HHI', manifest, 8)
        if sp_type != 0x0001:
            return manifest_bytes
        
        string_count, style_count, flags, strings_start, styles_start = struct.unpack_from('<IIIII', manifest, 16)
        is_utf8 = bool(flags & 0x00000100)
        
        if is_utf8:
            return manifest_bytes  # Our template is UTF-16LE
        
        string_offsets = [struct.unpack_from('<I', manifest, 36 + i * 4)[0] for i in range(string_count)]
        base_strings_offset = 8 + strings_start
        
        # Read all original strings
        strings = []
        for off in string_offsets:
            str_pos = base_strings_offset + off
            length = struct.unpack_from('<H', manifest, str_pos)[0]
            s = manifest[str_pos + 2 : str_pos + 2 + length * 2].decode('utf-16le', errors='ignore')
            strings.append(s)
        
        # Replace package ID while preserving Activity class name
        new_strings = []
        for s in strings:
            if s == 'com.webview.myapplication':
                new_strings.append(package_id)
            elif s == 'com.webview.myapplication.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION':
                new_strings.append(f"{package_id}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION")
            elif s == 'com.webview.myapplication.androidx-startup':
                new_strings.append(f"{package_id}.androidx-startup")
            elif s == 'com.webview.myapplication.MainActivity':
                # Crucial: Keep Activity class name so it matches classes.dex!
                new_strings.append('com.webview.myapplication.MainActivity')
            else:
                new_strings.append(s)
        
        # Rebuild string data and offset table
        new_string_bytes = bytearray()
        new_offsets = []
        for s in new_strings:
            new_offsets.append(len(new_string_bytes))
            s_u16 = s.encode('utf-16le')
            new_string_bytes.extend(struct.pack('<H', len(s)))
            new_string_bytes.extend(s_u16)
            new_string_bytes.extend(b'\x00\x00')
        
        # 4-byte align the string pool data
        pad = (4 - (len(new_string_bytes) % 4)) % 4
        if pad > 0:
            new_string_bytes.extend(b'\x00' * pad)
        
        # Styles handling (if any)
        styles_data = b''
        if style_count > 0 and styles_start > 0:
            styles_data = manifest[8 + styles_start : 8 + sp_chunk_size]
        
        new_strings_start = 28 + (string_count * 4) + (style_count * 4)
        new_sp_chunk_size = new_strings_start + len(new_string_bytes) + len(styles_data)
        
        sp_pad = (4 - (new_sp_chunk_size % 4)) % 4
        new_sp_chunk_size += sp_pad
        new_string_bytes.extend(b'\x00' * sp_pad)
        
        # Build new StringPool header
        new_sp_header = struct.pack('<HHI IIIII',
            0x0001, 28, new_sp_chunk_size,
            string_count, style_count, flags,
            new_strings_start,
            (new_strings_start + len(new_string_bytes)) if style_count > 0 else 0
        )
        
        new_offsets_table = bytearray()
        for off in new_offsets:
            new_offsets_table.extend(struct.pack('<I', off))
            
        new_sp_chunk = new_sp_header + new_offsets_table + new_string_bytes + styles_data
        axml_body = manifest[8 + sp_chunk_size :]
        new_total_size = 8 + len(new_sp_chunk) + len(axml_body)
        new_root_header = struct.pack('<HHI', 0x0003, 8, new_total_size)
        
        return bytes(new_root_header + new_sp_chunk + axml_body)
    except Exception as e:
        print(f"Warning: Failed to rebuild AXML stringpool: {e}", file=sys.stderr)
        return manifest_bytes

def patch_and_pack(base_path, out_path, app_name, target_url, theme_color='#0A0A0A', bg_color='#0A0A0A', raw_config=None, package_id='com.example.app', icon_map=None):
    if not os.path.exists(base_path):
        raise FileNotFoundError(f"Base APK template not found: {base_path}")

    with open(base_path, 'rb') as f:
        in_apk = zipfile.ZipFile(f)

        # 1. Patch classes.dex:
        # Patch string 3805 directly so MainActivity and NetworkCallback load target_url natively
        dex_bytes = in_apk.read('classes.dex')
        str_ids_off = struct.unpack_from('<I', dex_bytes, 0x3c)[0]
        str_ids_size = struct.unpack_from('<I', dex_bytes, 0x38)[0]
        s_off = struct.unpack_from('<I', dex_bytes, str_ids_off + 3805 * 4)[0]
        orig_len = dex_bytes[s_off] # 31
        orig_total_slot = 1 + orig_len + 1 # 33 bytes

        clean_url = target_url.strip() if target_url else 'https://example.com'
        target_bytes = clean_url.encode('utf-8')

        dex = bytearray(dex_bytes)
        if len(target_bytes) <= orig_len:
            encoded = bytes([len(target_bytes)]) + target_bytes + b'\x00'
            padding = orig_total_slot - len(encoded)
            dex[s_off : s_off + orig_total_slot] = encoded + (b'\x00' * padding)
        else:
            delta = (1 + len(target_bytes) + 1) - orig_total_slot
            encoded = bytes([len(target_bytes)]) + target_bytes + b'\x00'
            head = dex[:s_off]
            tail = dex[s_off + orig_total_slot:]
            dex = head + encoded + tail

            for i in range(str_ids_size):
                cur_off = struct.unpack_from('<I', dex, str_ids_off + i * 4)[0]
                if cur_off > s_off:
                    struct.pack_into('<I', dex, str_ids_off + i * 4, cur_off + delta)

            map_off = struct.unpack_from('<I', dex, 0x34)[0]
            struct.pack_into('<I', dex, 0x34, map_off + delta)
            map_size = struct.unpack_from('<I', dex, map_off + delta)[0]
            for i in range(map_size):
                item_pos = map_off + delta + 4 + i * 12
                type_code, _, size, offset = struct.unpack_from('<HHII', dex, item_pos)
                if offset > s_off:
                    struct.pack_into('<I', dex, item_pos + 8, offset + delta)

            struct.pack_into('<I', dex, 0x20, len(dex))

        # Recalculate SHA-1 and Adler-32 checksums
        sha1 = hashlib.sha1(dex[32:]).digest()
        dex[12:32] = sha1
        adler = zlib.adler32(dex[12:]) & 0xffffffff
        struct.pack_into('<I', dex, 8, adler)

        # 2. Patch resources.arsc:
        # In Android UTF-8 string pool, replace "My Application" (14 bytes) in-place
        arsc = bytearray(in_apk.read('resources.arsc'))
        target_name = b'My Application'
        idx = arsc.find(target_name)
        if idx != -1:
            clean_name = app_name[:14].encode('utf-8')
            L = len(clean_name)
            arsc[idx - 2] = L
            arsc[idx - 1] = L
            arsc[idx : idx + L] = clean_name
            arsc[idx + L : idx + len(target_name) + 1] = b'\x00' * (len(target_name) + 1 - L)

        # Patch theme colors in resources.arsc so Android Native theme, status bar, and toolbar match custom theme
        def parse_hex_color(hex_str, default_argb=(255, 10, 10, 10)):
            if not hex_str:
                return default_argb
            h = hex_str.lstrip('#').strip()
            if len(h) == 3:
                r = int(h[0]*2, 16)
                g = int(h[1]*2, 16)
                b = int(h[2]*2, 16)
                return (255, r, g, b)
            elif len(h) == 6:
                r = int(h[0:2], 16)
                g = int(h[2:4], 16)
                b = int(h[4:6], 16)
                return (255, r, g, b)
            elif len(h) == 8:
                a = int(h[0:2], 16)
                r = int(h[2:4], 16)
                g = int(h[4:6], 16)
                b = int(h[6:8], 16)
                return (a, r, g, b)
            return default_argb

        ca, cr, cg, cb = parse_hex_color(theme_color)
        theme_bytes = bytes([cb, cg, cr, ca])
        # Status bar darker variant (darken by 20%)
        dcr = max(0, int(cr * 0.8))
        dcg = max(0, int(cg * 0.8))
        dcb = max(0, int(cb * 0.8))
        darker_theme_bytes = bytes([dcb, dcg, dcr, ca])

        for old_col, new_col in [
            (b'\xee\x00\x62\xff', theme_bytes),        # purple_500 (colorPrimary)
            (b'\xb3\x00\x37\xff', darker_theme_bytes), # purple_700 (colorPrimaryDark / Status Bar)
            (b'\xfc\x86\xbb\xff', theme_bytes),        # purple_200
            (b'\xc5\xda\x03\xff', theme_bytes),        # teal_200 (colorSecondary)
            (b'\x86\x87\x01\xff', darker_theme_bytes), # teal_700
        ]:
            pos = 0
            while True:
                idx_c = arsc.find(old_col, pos)
                if idx_c == -1:
                    break
                arsc[idx_c : idx_c + 4] = new_col
                pos = idx_c + 4

        # 3. Patch AndroidManifest.xml:
        # Replace default package 'com.webview.myapplication' with the user's custom package_id
        # While strictly preserving MainActivity class name so Android ClassLoader does not crash
        orig_manifest = in_apk.read('AndroidManifest.xml')
        cleaned_package_id = package_id.strip() if package_id else 'com.bapp.app'
        patched_manifest = rebuild_axml_stringpool(orig_manifest, cleaned_package_id)

        # 4. Generate high-performance offline & splash HTML
        first_char = (app_name[:1] or 'A').upper()
        escaped_title = app_name.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        json_target_url = json.dumps(target_url)

        # Ensure theme color is valid and contrast is preserved
        active_theme_color = theme_color if theme_color else '#0A0A0A'
        active_bg_color = bg_color if bg_color else '#0A0A0A'
        btn_border = "border: 1px solid rgba(255,255,255,0.25);" if active_theme_color in ['#000000', '#0A0A0A', '#18181B', '#111827'] else ""

        # Extract icon data URI if provided in raw_config
        icon_data_uri = None
        if raw_config and isinstance(raw_config, dict):
            icon_data_uri = raw_config.get('iconDataUri')

        if icon_data_uri:
            icon_markup = f'<img src="{icon_data_uri}" class="icon-img" alt="{escaped_title}" />'
        else:
            icon_markup = f'<div class="icon">{first_char}</div>'

        offline_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="{active_theme_color}">
  <title>{escaped_title}</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body, html {{
      width: 100%; height: 100%; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: {active_bg_color};
      color: #FFFFFF;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }}
    .splash {{
      display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px;
    }}
    .icon {{
      width: 84px; height: 84px; border-radius: 22px; background-color: {active_theme_color};
      display: flex; align-items: center; justify-content: center; font-size: 38px;
      font-weight: 700; color: #FFFFFF; box-shadow: 0 12px 30px rgba(0,0,0,0.35);
      margin-bottom: 22px; border: 1px solid rgba(255,255,255,0.15);
    }}
    .icon-img {{
      width: 84px; height: 84px; border-radius: 22px; object-fit: cover;
      box-shadow: 0 12px 30px rgba(0,0,0,0.35); margin-bottom: 22px;
      border: 1px solid rgba(255,255,255,0.15); background-color: #FFFFFF;
    }}
    .title {{ font-size: 22px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.02em; }}
    .subtitle {{ font-size: 13px; opacity: 0.65; margin-bottom: 28px; }}
    .spinner {{
      width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.18);
      border-top-color: {active_theme_color}; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }}
    @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
    .offline {{
      display: none; flex-direction: column; align-items: center; text-align: center;
      padding: 32px 24px; max-width: 360px;
    }}
    .offline-icon {{ font-size: 44px; margin-bottom: 16px; opacity: 0.9; }}
    .offline-title {{ font-size: 20px; font-weight: 700; margin-bottom: 8px; }}
    .offline-desc {{ font-size: 14px; opacity: 0.7; margin-bottom: 24px; line-height: 1.5; }}
    .btn {{
      background-color: {active_theme_color}; color: #FFFFFF; border: none; border-radius: 12px;
      padding: 14px 32px; font-size: 15px; font-weight: 600; cursor: pointer; {btn_border}
    }}
  </style>
</head>
<body>
  <div id="splash-view" class="splash">
    {icon_markup}
    <div class="title">{escaped_title}</div>
    <div class="subtitle">Loading app...</div>
    <div class="spinner"></div>
  </div>
  <div id="offline-view" class="offline">
    <div class="offline-icon">&#9888;</div>
    <div class="offline-title">No Connection</div>
    <div class="offline-desc">Unable to load the requested page. Please check your network connection and tap retry.</div>
    <button class="btn" onclick="retry()">Retry Connection</button>
  </div>
  <script>
    var TARGET_URL = {json_target_url};
    function launch() {{
      try {{
        window.location.replace(TARGET_URL);
      }} catch(e) {{
        window.location.href = TARGET_URL;
      }}
    }}
    function showOffline() {{
      var s = document.getElementById('splash-view');
      var o = document.getElementById('offline-view');
      if (s) s.style.display = 'none';
      if (o) o.style.display = 'flex';
    }}
    function retry() {{
      var s = document.getElementById('splash-view');
      var o = document.getElementById('offline-view');
      if (o) o.style.display = 'none';
      if (s) s.style.display = 'flex';
      setTimeout(launch, 300);
    }}
    window.addEventListener('online', launch);
    if (document.readyState === 'loading') {{
      document.addEventListener('DOMContentLoaded', function() {{
        setTimeout(launch, 50);
      }});
    }} else {{
      setTimeout(launch, 50);
    }}
  </script>
</body>
</html>""".encode('utf-8')

        # 5. Prepare application configuration JSON
        config_data = {
            'appName': app_name,
            'packageId': cleaned_package_id,
            'bundleId': cleaned_package_id,
            'websiteUrl': target_url,
            'themeColor': active_theme_color,
            'splashBackgroundColor': active_bg_color,
        }
        if raw_config and isinstance(raw_config, dict):
            config_data.update(raw_config)
        config_bytes = json.dumps(config_data, indent=2).encode('utf-8')

        # 6. Pack into aligned APK
        out_io = io.BytesIO()
        out_zip = zipfile.ZipFile(out_io, 'w')

        file_map = {}
        for info in in_apk.filelist:
            # Strip old signature files so apk_sign_ts can sign cleanly
            if info.filename.startswith('META-INF/') and (
                info.filename.endswith('.SF') or
                info.filename.endswith('.RSA') or
                info.filename.endswith('.DSA') or
                info.filename.endswith('.EC') or
                info.filename == 'META-INF/MANIFEST.MF'
            ):
                continue

            if icon_map and info.filename in icon_map:
                # Replace with user-generated custom icon PNG for this density
                file_map[info.filename] = (zipfile.ZIP_DEFLATED, icon_map[info.filename], info.date_time)
            elif info.filename == 'AndroidManifest.xml':
                file_map[info.filename] = (zipfile.ZIP_DEFLATED, patched_manifest, info.date_time)
            elif info.filename == 'classes.dex':
                file_map[info.filename] = (zipfile.ZIP_STORED, bytes(dex), info.date_time)
            elif info.filename == 'resources.arsc':
                file_map[info.filename] = (zipfile.ZIP_STORED, bytes(arsc), info.date_time)
            elif info.filename == 'assets/offline.html':
                file_map[info.filename] = (zipfile.ZIP_DEFLATED, offline_html, info.date_time)
            else:
                file_map[info.filename] = (info.compress_type, in_apk.read(info.filename), info.date_time)

        # Inject runtime configuration
        file_map['assets/bapp_config.json'] = (zipfile.ZIP_DEFLATED, config_bytes, (2026, 1, 1, 0, 0, 0))

        # Write each file with strict 4-byte alignment for STORED files
        for fname, (comp_type, content, dt) in file_map.items():
            new_info = zipfile.ZipInfo(fname, dt)
            new_info.compress_type = comp_type

            if comp_type == zipfile.ZIP_STORED:
                curr_offset = out_io.tell()
                base_data_offset = curr_offset + 30 + len(fname.encode('utf-8'))
                pad = (4 - (base_data_offset % 4)) % 4
                if pad > 0:
                    new_info.extra = b'\x00' * pad

            out_zip.writestr(new_info, content)

        out_zip.close()
        out_bytes = out_io.getvalue()

        # Write to destination
        with open(out_path, 'wb') as out_f:
            out_f.write(out_bytes)

if __name__ == '__main__':
    if len(sys.argv) < 5:
        print("Usage: apkPacker.py <base_apk> <out_apk> <app_name> <target_url> [theme_color] [bg_color] [config_json] [package_id] [icons_json_path]")
        sys.exit(1)

    base_apk = sys.argv[1]
    out_apk = sys.argv[2]
    app_name = sys.argv[3]
    target_url = sys.argv[4]
    theme_color = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] else '#0A0A0A'
    bg_color = sys.argv[6] if len(sys.argv) > 6 and sys.argv[6] else '#0A0A0A'
    raw_config = None
    if len(sys.argv) > 7 and sys.argv[7]:
        try:
            raw_config = json.loads(sys.argv[7])
        except Exception:
            pass
    
    package_id = sys.argv[8] if len(sys.argv) > 8 and sys.argv[8] else 'com.bapp.app'
    if raw_config and isinstance(raw_config, dict) and 'packageId' in raw_config and raw_config['packageId']:
        package_id = raw_config['packageId']

    icon_map = None
    icons_json_path = sys.argv[9] if len(sys.argv) > 9 and sys.argv[9] else None
    if icons_json_path and os.path.exists(icons_json_path):
        try:
            import base64
            with open(icons_json_path, 'r') as f:
                raw_icons = json.load(f)
                icon_map = {}
                for k, v in raw_icons.items():
                    icon_map[k] = base64.b64decode(v)
        except Exception as e:
            print(f"Warning: Failed to load icon map: {e}", file=sys.stderr)

    patch_and_pack(base_apk, out_apk, app_name, target_url, theme_color, bg_color, raw_config, package_id, icon_map)

