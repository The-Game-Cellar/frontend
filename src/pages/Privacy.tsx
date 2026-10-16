import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './Privacy.css'

interface Part {
  id: string
  short: string
  title: string
  body: ReactNode
}

interface PolicyTableProps {
  heads: string[]
  rows: ReactNode[][]
  // Keeps a short last column (a legal basis, a lifetime) on one line.
  nowrapLast?: boolean
}

interface BasisProps {
  name: string
  art: string
}

const MAIL = <a className="lnk" href="mailto:hello@gamecellar.app">hello@gamecellar.app</a>

function PolicyTable({ heads, rows, nowrapLast = false }: PolicyTableProps) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>{heads.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, i) => (
                <td key={i} data-l={heads[i]} className={nowrapLast && i === row.length - 1 ? 'nowrap' : undefined}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Basis({ name, art }: BasisProps) {
  return <><span className="basis">{name}</span><small>Art. {art}</small></>
}

const GLANCE: [string, string][] = [
  ['No ads, no analytics', 'Nothing on the site measures you or sells your attention.'],
  ['Only what the service needs', 'An account, your library, and short-lived logs.'],
  ['Take it with you', 'Your Profile page exports everything as a file.'],
  ['Gone when you say so', 'Delete your account and it is removed at once. Backups expire within 30 days.'],
]

const PARTS: Part[] = [
  {
    id: 'who', short: 'Who is responsible', title: 'Who is responsible', body: <>
      <p>The Game Cellar is run by Alexander Westerberg, a private individual in Sweden, who is the data controller for everything on this page.</p>
      <p>Write to {MAIL} about anything to do with your data. You get an answer within one month, the limit the law sets.</p>
    </>,
  },
  {
    id: 'collected', short: 'What is collected', title: 'What is collected, and why', body: <>
      <p>The Game Cellar collects five kinds of personal data, each for one reason.</p>
      <PolicyTable heads={['Data', 'Why', 'Legal basis']} nowrapLast rows={[
        [
          <>Your account<small>Username, email address and password, the password stored only as a hash. A first and last name only if you add them in your account settings. While you are signed in, the IP address of the session.</small></>,
          'To sign you in, confirm your address and send password resets.',
          <Basis name="Contract" art="6(1)(b)" />,
        ],
        [
          <>Your library<small>The games you add, with their status, your rating, notes, playtime and when you last played; your platforms; the genres, tags and eras you pick as preferences; and the recommendation profile worked out from all of it.</small></>,
          'This is the service itself: your shelf, your statistics and your recommendations.',
          <Basis name="Contract" art="6(1)(b)" />,
        ],
        [
          <>Server logs<small>IP address, the address requested, time, response, referring page and browser. A failed sign-in also records the username tried, and requests are counted per IP address.</small></>,
          'To keep the site running and to find and block abuse, such as password guessing.',
          <Basis name="Legitimate interest" art="6(1)(f)" />,
        ],
        [
          <>Error reports<small>What failed and where, the pages, requests and clicks just before it, the address requested, your browser and operating system, the country the request came from and, when you are signed in, your internal account number. Sent without your IP address, name or email.</small></>,
          'To find and fix bugs.',
          <Basis name="Legitimate interest" art="6(1)(f)" />,
        ],
        [
          <>Mail to hello@<small>Your address and what you write.</small></>,
          'To answer you.',
          <Basis name="Legitimate interest" art="6(1)(f)" />,
        ],
      ]} />
      <p className="note">Nothing else. There is no analytics, no advertising identifier and no profile bought or built from outside the site. Recommendations are worked out inside the service, from your own library, and no decision with legal or similarly significant effect is ever made about you automatically.</p>
      <p className="note">Only the account is required: without a username, an email address and a password there is no account to keep your library in. Everything else is up to you.</p>
    </>,
  },
  {
    id: 'cookies', short: 'Cookies', title: 'Cookies and browser storage', body: <>
      <p>The site sets only what signing in needs, plus a few small things kept in your own browser. None of it follows you to other sites.</p>
      <PolicyTable heads={['Name', 'Where', 'Purpose', 'Lifetime']} nowrapLast rows={[
        [<code>access_token</code>, 'gamecellar.app', 'Shows the server you are signed in.', '5 minutes'],
        [<code>refresh_token</code>, 'gamecellar.app', 'Renews your sign-in without asking for the password again.', '30 minutes'],
        [<code>JSESSIONID</code>, 'gamecellar.app', 'Carries the sign-in while you go to the sign-in page and back.', 'Until you close the browser'],
        ['Sign-in cookies', 'auth.gamecellar.app', 'Keep the sign-in and account pages working.', 'The sign-in session'],
        [<code>library_view</code>, 'Your browser', 'Remembers list or grid in your library.', 'Until cleared'],
        [<code>cellar:first_login_done</code>, 'Your browser', 'Shows the long welcome only the first time.', 'Until cleared'],
        [<code>cellar:pending_login</code>, 'Your browser', 'Notes that you are on your way back from signing in.', 'Until you close the tab'],
        [
          <><code>cellar:recs:shown</code><br /><code>cellar:upcoming:shown</code></>,
          'Your browser',
          'The games already shown to you, so recommendations and upcoming games do not repeat.',
          'Until you sign out',
        ],
      ]} />
      <p className="note">A game page with a trailer embeds it from YouTube, and YouTube can set cookies of its own once the player loads.</p>
    </>,
  },
  {
    id: 'others', short: 'Who else handles it', title: 'Who else handles it', body: <>
      <p>These services handle personal data on the site’s behalf, or see it on the way through.</p>
      <PolicyTable heads={['Service', 'What it does', 'Where']} rows={[
        ['Hetzner', 'Runs the server and the databases.', 'Helsinki, Finland'],
        ['Cloudflare', 'Sits in front of the site (DNS, encryption, protection against abuse), keeps the nightly backups and forwards mail sent to hello@.', 'Global network, US company'],
        ['Resend and Amazon Web Services', 'Send the account emails: address confirmation, password reset and email change.', 'Ireland, US companies'],
        ['Sentry', 'Receives error reports.', 'Germany, US company'],
        ['Google', 'Holds the hello@ inbox (Gmail), serves the site’s typeface (Google Fonts) and plays trailers (YouTube).', 'US company'],
        ['IGDB, owned by Twitch', 'Supplies the game catalog. Cover images load straight from IGDB’s image server.', 'US company'],
      ]} />
      <p className="note">Because the typeface and the trailers come from Google and the covers from IGDB, your browser sends those two your IP address, as it does to any site it loads something from. Neither receives anything else about you from The Game Cellar.</p>
    </>,
  },
  {
    id: 'kept', short: 'How long it is kept', title: 'How long it is kept', body: (
      <PolicyTable heads={['Data', 'Kept']} rows={[
        ['Account and library', 'Until you delete your account.'],
        ['IP address of a session', 'While you are signed in, 10 hours at most.'],
        ['After you delete it', 'Removed from the live service at once. Nightly backups roll over within 30 days, server snapshots within 7.'],
        ['Record of a deletion', 'No end date. The internal account number and two dates, with no name and no email, so an interrupted deletion can be finished and there is a record that it was asked for.'],
        ['Server logs', '14 days.'],
        ['Request counts per IP address', '15 minutes.'],
        ['Error reports', '30 days.'],
        ['Mail to hello@', 'Until the conversation is over.'],
      ]} />
    ),
  },
  {
    id: 'rights', short: 'Your rights', title: 'Your rights', body: (
      <ul className="rights">
        <li><b>See and take it</b><span>Export on your Profile page gives you everything as a JSON file. For anything else held about you, write to {MAIL}.</span></li>
        <li><b>Correct it</b><span>Change your email address from your Profile page. For anything else, write in.</span></li>
        <li><b>Delete it</b><span>Delete account on your Profile page removes your account at once. Backups follow within 30 days.</span></li>
        <li><b>Object or restrict</b><span>Write in and say what you want stopped.</span></li>
        <li><b>Complain</b><span>To Integritetsskyddsmyndigheten (IMY), the Swedish data protection authority, at <a className="lnk" href="https://www.imy.se" rel="noopener">imy.se</a>, or to the authority where you live.</span></li>
      </ul>
    ),
  },
  {
    id: 'transfers', short: 'Outside the EU', title: 'Data outside the EU', body: (
      <p>Cloudflare, Resend, Amazon, Sentry and Google are US companies, so your data can reach the United States even where it is stored in the EU. All five are certified under the EU-US Data Privacy Framework, which is what those transfers rest on.</p>
    ),
  },
  {
    id: 'changes', short: 'Changes', title: 'Changes to this page', body: (
      <p>The date at the top changes whenever this page does.</p>
    ),
  },
]

export default function Privacy() {
  const [active, setActive] = useState(PARTS[0].id)
  const pinned = useRef(false)
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined)

  // The lit row is the last section whose top has passed a line a third of the way down. Over the
  // last screen of scroll the line slides to the bottom edge, since the closing sections are too
  // short to ever reach it. Worked out from positions on every frame, so a fast scroll cannot
  // leave a stale row lit.
  useEffect(() => {
    const sections = PARTS
      .map((p) => document.getElementById(p.id))
      .filter((el): el is HTMLElement => el !== null)
    // A clicked row stays lit through the scroll it starts. scrollend marks the end where the
    // browser has it; a pause in scroll events stands in where it does not.
    const hasEnd = 'onscrollend' in window
    let frame = 0

    function update() {
      frame = 0
      if (pinned.current || sections.length === 0) return
      const vh = window.innerHeight
      const base = vh * 0.3
      const left = document.documentElement.scrollHeight - vh - window.scrollY
      const line = base + (vh - base) * Math.min(1, Math.max(0, 1 - left / (vh - base)))
      let id = sections[0].id
      sections.forEach((s) => {
        if (s.getBoundingClientRect().top <= line) id = s.id
      })
      setActive(id)
    }
    function queue() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    function onScroll() {
      if (!pinned.current) {
        queue()
      } else if (!hasEnd) {
        clearTimeout(settle.current)
        settle.current = setTimeout(() => { pinned.current = false }, 150)
      }
    }
    function onScrollEnd() {
      clearTimeout(settle.current)
      pinned.current = false
    }

    // The sections exist only after render, so a deep link's fragment is resolved here. Left
    // undecoded: the ids are plain words, and decoding a malformed escape throws.
    const hash = window.location.hash.slice(1)
    if (hash) document.getElementById(hash)?.scrollIntoView()
    queue()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scrollend', onScrollEnd)
    window.addEventListener('resize', queue)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scrollend', onScrollEnd)
      window.removeEventListener('resize', queue)
      cancelAnimationFrame(frame)
      clearTimeout(settle.current)
    }
  }, [])

  function pin(id: string) {
    const y0 = window.scrollY
    pinned.current = true
    setActive(id)
    clearTimeout(settle.current)
    // Already in place, so no scroll and no scrollend will come.
    settle.current = setTimeout(() => {
      if (window.scrollY === y0) pinned.current = false
    }, 300)
  }

  return (
    <main className="privacy">
      <nav className="toc" aria-label="On this page">
        <p className="lbl"><span>On this page</span></p>
        <ol>
          {PARTS.map((p, i) => (
            <li key={p.id}>
              <a href={`#${p.id}`} className={p.id === active ? 'on' : undefined} onClick={() => pin(p.id)}>
                <span className="n">{i + 1}</span><span>{p.short}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <article>
        <header className="head">
          <p className="eyebrow">Privacy policy</p>
          <h1>What the cellar <span className="grad">keeps</span> about you</h1>
          <p className="lede">The Game Cellar is a game library tracker run by one person. This page lists every piece of personal data it handles, why, who else sees it and how long it stays.</p>
          <p className="meta">Last updated 1 October 2026</p>
        </header>

        <div className="glance">
          {GLANCE.map(([title, text]) => (
            <div key={title}><strong>{title}</strong><span>{text}</span></div>
          ))}
        </div>

        {PARTS.map((p, i) => (
          <section className="part" id={p.id} key={p.id}>
            <h2><span className="n">§ {i + 1}</span><span>{p.title}</span></h2>
            {p.body}
          </section>
        ))}

        <div className="contact">
          <p>Questions about your data?</p>
          {MAIL}
        </div>
      </article>
    </main>
  )
}
