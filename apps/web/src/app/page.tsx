import Link from 'next/link';

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-white pt-20 pb-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-1.5 text-sm text-primary-700 font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            Global collaborative IP platform
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-gray-900 leading-tight mb-6">
            You don't need to write<br />
            <span className="text-primary-600">the whole story.</span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto">
            Have an idea but can't write? Have writing skills but no ideas?
            On Comuse, anyone contributes their piece — and together we create global IP.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition text-lg"
            >
              Start for free
            </Link>
            <Link
              href="/explore"
              className="px-8 py-3.5 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition text-lg text-gray-700"
            >
              Browse projects
            </Link>
          </div>
        </div>

        {/* Background blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary-50 blur-3xl opacity-60" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-violet-50 blur-3xl opacity-60" />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How it works</h2>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
            Like git branches for stories — one idea can grow into infinite directions
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: '💡', title: 'Drop an idea', desc: 'Upload a concept, a premise, or just the first line. That\'s enough.' },
              { icon: '✍️', title: 'Others build on it', desc: 'Writers, worldbuilders, and finishers each add their piece.' },
              { icon: '🌿', title: 'Infinite branching', desc: 'Stories fork in new directions. The best ones float to the top.' },
              { icon: '💰', title: 'Earn together', desc: 'When the IP sells — Netflix, webtoon, game — everyone gets their share.' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">Who is Comuse for?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: '💡', title: 'Idea people', desc: 'You have great concepts but can\'t write full stories.' },
              { emoji: '✍️', title: 'Writers', desc: 'You can write beautifully — but you need better starting material.' },
              { emoji: '🎯', title: 'Finishers', desc: 'You excel at endings and resolution. Pick up where others left off.' },
              { emoji: '🌍', title: 'Everyone', desc: 'Any language, any genre. The platform translates everything automatically.' },
            ].map((t, i) => (
              <div key={i} className="p-5 rounded-xl border border-gray-200 hover:border-primary-200 transition">
                <div className="text-3xl mb-3">{t.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{t.title}</h3>
                <p className="text-sm text-gray-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue */}
      <section className="bg-gradient-to-br from-primary-600 to-violet-700 py-20 px-4 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Your ideas have real value</h2>
          <p className="text-primary-200 mb-12 max-w-xl mx-auto">
            When IP from Comuse gets sold or licensed, revenue is split automatically
            based on AI-analyzed contribution — fairly, transparently, globally.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'AI measures contribution', desc: 'Each piece — idea, story, ending — gets a fair score automatically.' },
              { icon: '⟠', title: 'Ethereum smart contract', desc: 'Revenue splits across countries with no bank, no friction.' },
              { icon: '🎬', title: 'Netflix, studios, publishers', desc: 'Your story could become the next global hit. We handle the deal.' },
            ].map((r, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 text-left">
                <div className="text-2xl mb-3">{r.icon}</div>
                <h3 className="font-semibold mb-2">{r.title}</h3>
                <p className="text-primary-200 text-sm leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to start?</h2>
          <p className="text-gray-500 mb-8">Free to join. Start with just an idea.</p>
          <Link
            href="/login"
            className="inline-block px-10 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition text-lg"
          >
            Join Comuse
          </Link>
        </div>
      </section>
    </div>
  );
}
