# Story layer — question, arc, beats, words

Distilled from 22 reference reels of the style (83–178 s each, most 2–3 minutes; one 45 s short). Read this before writing a single line of the script. The script decides the video; the pictures only follow it.

## 1. The question (the title)

Every video answers **one question a normal person has half-wondered about**, asked in their words. The title is the question, and it is also the first beat's job.

| Pattern | Reference examples |
|---|---|
| `why_number` — a number that looks wrong | "Why does a 1TB hard drive only show 931GB in Windows?" |
| `why_hard` — why doesn't anyone just… | "Why is it almost impossible to build a new web browser?" · "…why can't anyone build a new search engine?" |
| `how_know` — how does a thing know something | "How does auto-rotate know you turned your phone?" · "How does your laptop know the time after you shut it down?" · "How do companies know you opened their email?" |
| `is_it_true` — a fear or rumour, checked | "Is your smart TV watching you?" · "Do you think social media only tracks the videos you watch?" |
| `what_happens` — follow one action end to end | "What happens when you type chatgpt.com and press Enter?" |
| `news_explained` — this week's story, what actually happened | "Why is Nvidia investigating its CEO?" · "Why are companies taking their websites offline this week?" |
| `paradox` — a timeline that looks backwards | "Why could you download GTA 6 a week before you could play it?" |
| `connection` — two things nobody links | "What does Dota 2 have to do with ChatGPT?" |
| `how_cracked` — how a lock was beaten (history, explained, never a how-to) | "How did keygens crack Photoshop?" |
| `can_it` — a surprising ability, checked | "Can your Wi-Fi router tell when you move, even through walls?" |
| `confession` — first-person myth, then the truth | "I always thought hitting delete meant the photo was gone… Turns out, not really." |

Bad questions: anything the viewer has never noticed, anything answered in one sentence, a list of features.

## 2. The arc

Pick one. `how_it_works` and `why_number` cover most tech topics.

| Arc | Shape (one beat each, roughly) | Use for |
|---|---|---|
| `how_it_works` | Hook question → the everyday moment → the hidden part, named → step → step → step → the surprising number → recap → follow | systems, protocols, devices (DNS, torrents, auto-rotate, the RTC clock) |
| `why_number` | Hook with the wrong-looking number → the two ways to count → show both side by side → where the gap comes from → it grows (bigger case) → who fixed the name / why nobody uses it → recap → follow | 931 GB, battery %, megapixels, "5G" speeds |
| `why_hard` | Hook → "it looks easy" → layer 1 of what it takes → layer 2 → layer 3 + the scale number → who tried and how far they got → the honest answer (AI can't either, yet) → follow | browsers, search engines, chips, OSes |
| `myth_check` | The fear, stated fairly → what it really can do (proof: the policy text, a setting) → what it can't → the real risk → what to change today → follow | smart TV, phone "listening", deleted photos |
| `news_explained` | Headline fact → who the people/companies are → what happened, in order → why it matters to you → what's not known yet → follow | court cases, outages, CEOs, regulations |
| `connection` | Hook: the odd pair → thing A at its peak (a year chip) → the step that led on (another year) → the idea that carried over → thing B today → the link in one line → callback sign-off | tech history, "X was built on Y" |
| `what_happens` | Hook: the action → stop 1 → stop 2 → … (4–6 stops, each one named) → all of it in N ms → follow | a URL, a payment tap, sending a photo |

## 3. Beats, chunks and words

- **A beat = one scene = one idea = one picture state.** 2–4 caption chunks, 6–14 s.
- **A chunk = 3–7 words**, cut at natural pauses: `You type a website name, / and a page appears / in under a second.` Keep the comma or full stop with the chunk; it becomes the pause in the voice.
- **Pace:** ~170 words a minute (measured on the references: 172). Duration → words → beats:

  | Length | Words | Beats | Fits |
  |---|---|---|---|
  | 45 s | ~120 | 6–7 | one mechanism, Shorts |
  | 90 s | ~250 | 10–12 | the default |
  | 2–3 min | 340–500 | 15–22 | why_hard, news_explained, the reference norm |

- **Change the picture every 3–6 s.** A beat longer than ~10 s needs a second picture state inside it (something new pops in on chunk 2 or 3, or the beat zooms).
- **Hook in the first 3 s:** the question or the surprising number, never a greeting or "in this video".
- **Name, then explain:** "…a DNS server, / the internet's phone book." The name appears as a label the moment it's said.
- **One number per beat**, said as people say it ("about sixty times a second", "nine hundred thirty-one gigabytes"), and shown as a `stat` or a number label.
- **Concrete over abstract:** the 1 cm cube, the scale with likes on it, the stack of paper that is 35 million lines.
- **Fair and exact.** News and myth topics state what is known, who said it, and what isn't proven ("She hasn't been charged."). Never invent a number; leave it out if unsure.

## 4. The ending

1. **Recap** in one line that echoes the beats: "Name, number, / handshake, packets."
2. Optional **callback**: open and close on the same person or object; the sign-off can echo the topic (the Dota reel ends "GG,").
3. **Follow card** (`tx:follow`) with a **teaser** for a related question: "Follow Your Channel, / and next time, / I'll show you what a cookie / really remembers." The teaser is a real next topic, not "more videos".

## 5. The post (deliver this with the video)

The references always ship the same post text. Write it alongside the video:

```
<The question as the title> <one emoji>

<Paragraph 1: the short answer, 2–3 sentences, with the key number.>

<Paragraph 2: the mechanism, 2–3 sentences.>

<Paragraph 3: the twist or the honest limit, 1–2 sentences.>

Know someone who <has / wants / thinks> <the thing>? Send them this.
<One question to the viewer, easy to answer in a word: "Which browser are you on?">

#<Topic> #<Thing> #<Company> #TechExplained
```

## 6. The approval gate

Unless the user asked for the finished video in one go, **show them the beat map first**: the title, the arc, and every beat's chunks plus a one-line picture note. Build it after they say yes. Rewriting a script costs a minute; rebuilding scenes costs much more.

```
Title: What happens when you type a URL?     Arc: what_happens     ~52 s, 8 beats
b1 Hook      You type a website name, / and a page appears / in under a second. / So what just happened?
             → browser window fills in; "< 1 s" stat
b2 Names     But computers don't know names. / They only know numbers, / called IP addresses.
             → example.com label → wire → 93.184.215.14 label (green on "IP addresses")
…
```
