import React from 'react';
import {
  Code2,
  Terminal,
  Smartphone,
  Shield,
  Sparkles,
  MapPin,
  Briefcase,
  GraduationCap,
  Quote,
  ExternalLink,
  Layers,
  Film,
  HelpCircle,
  Newspaper,
  Github,
  CheckCircle2,
  User
} from 'lucide-react';

export const AboutDeveloper: React.FC = () => {
  const technologies = [
    'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React',
    'Node.js', 'Python', 'C', 'Java', 'Kotlin',
    'Firebase', 'Git', 'GitHub', 'Linux'
  ];

  const whatIDo = [
    {
      title: 'Web Development',
      desc: 'Building modern, responsive and interactive web applications.',
      icon: Code2,
      tag: 'Frontend & Full-Stack',
    },
    {
      title: 'Software Development',
      desc: 'Creating practical tools and applications from ideas.',
      icon: Terminal,
      tag: 'Tools & Utilities',
    },
    {
      title: 'Mobile Development',
      desc: 'Exploring Android and iOS application development.',
      icon: Smartphone,
      tag: 'Android & iOS',
    },
    {
      title: 'Cybersecurity',
      desc: 'Learning about Linux, networking, security and ethical hacking.',
      icon: Shield,
      tag: 'Linux & Networks',
    },
    {
      title: 'Creative Technology',
      desc: 'Experimenting with games, AI, automation and new technologies.',
      icon: Sparkles,
      tag: 'AI & Automation',
    },
  ];

  const projects = [
    {
      title: 'Bapp',
      desc: 'A platform for turning websites into mobile applications.',
      icon: Layers,
      highlight: 'Core Project',
      url: '#',
    },
    {
      title: 'BeepCinema',
      desc: 'A modern movie discovery and browsing web project.',
      icon: Film,
      highlight: 'Entertainment',
      url: 'https://beepcinema.com',
    },
    {
      title: 'Quizzy',
      desc: 'A quiz platform designed for students and educational use.',
      icon: HelpCircle,
      highlight: 'Education',
      url: '#',
    },
    {
      title: 'YuvaUpdate',
      desc: 'A student-focused platform for educational and important updates.',
      icon: Newspaper,
      highlight: 'Student Portal',
      url: '#',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 space-y-16 animate-in fade-in duration-300">
      {/* Profile Header Card */}
      <section className="relative overflow-hidden p-8 sm:p-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar / Real Developer Photo */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-md border-2 border-neutral-200 dark:border-neutral-700 shrink-0 bg-neutral-900 dark:bg-white">
              <img
                src="https://github.com/BipinDev404.png"
                alt="Bipin Yadav"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to stylized monogram if image is unavailable
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="avatar-fallback hidden w-full h-full text-white dark:text-neutral-900 items-center justify-center font-bold text-3xl sm:text-4xl">
                BY
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Bipin Yadav
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                  @BipinDev404
                </span>
              </div>

              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Founder & Developer
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Bihar, India</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Software Development & Technology</span>
                </div>
              </div>
            </div>
          </div>

          {/* GitHub CTA */}
          <a
            href="https://github.com/BipinDev404"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold transition shadow-sm self-stretch sm:self-auto justify-center"
          >
            <Github className="w-4 h-4" />
            <span>GitHub Profile</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>

        {/* Short Bio */}
        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
            Hi, I'm <strong className="font-semibold text-neutral-900 dark:text-white">Bipin Yadav</strong>, a developer and technology enthusiast from Bihar, India. I enjoy building websites, applications, developer tools, and experimental software projects. I love turning ideas into real, useful products and exploring new technologies along the way.
          </p>
        </div>
      </section>

      {/* About Me Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              About Me
            </h2>
          </div>
          
          <div className="space-y-3.5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <p>
              I'm a software developer and BCA student with a strong interest in programming, web development, mobile applications, cybersecurity, and emerging technologies.
            </p>
            <p>
              I enjoy learning by building. Instead of just studying a technology, I like creating real projects with it and experimenting with different ideas.
            </p>
            <p>
              My projects range from web applications and educational platforms to creative experiments and developer tools. <strong className="font-semibold text-neutral-900 dark:text-white">Bapp</strong> is one of my projects, created to make the process of turning websites into mobile applications simpler.
            </p>
          </div>
        </div>

        {/* Developer Quote Card */}
        <div className="p-8 bg-neutral-950 text-white rounded-3xl flex flex-col justify-between border border-neutral-800 shadow-md">
          <Quote className="w-8 h-8 text-neutral-500 opacity-60 mb-4" />
          <blockquote className="text-base font-medium leading-relaxed italic text-neutral-200">
            "I don't just want to learn technology. I want to use it to build something real."
          </blockquote>
          <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-white">— Bipin Yadav</span>
            <span className="text-[11px] font-mono">BipinDev404</span>
          </div>
        </div>
      </section>

      {/* What I Do Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            What I Do
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Focus areas and technical disciplines
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {whatIDo.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technologies Section */}
      <section className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Technologies & Tools
            </h2>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {technologies.length} Stack Tools
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {technologies.map((tech) => (
            <span
              key={tech}
              className="px-3.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono font-medium transition"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Projects
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Real-world applications and tools built by Bipin Yadav
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {projects.map((proj, idx) => {
            const Icon = proj.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-md">
                      {proj.highlight}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {proj.desc}
                  </p>
                </div>

                {proj.url !== '#' && (
                  <div className="pt-2">
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-white hover:underline"
                    >
                      <span>Visit project</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Connect / Footer Contact */}
      <section className="p-8 bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-3xl text-center space-y-4">
        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
          Connect with the Developer
        </h3>
        <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
          Check out open-source code repositories, stars, and upcoming software projects on GitHub.
        </p>
        <div className="pt-2">
          <a
            href="https://github.com/BipinDev404"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <Github className="w-4 h-4" />
            <span>Follow @BipinDev404 on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>
      </section>
    </div>
  );
};
