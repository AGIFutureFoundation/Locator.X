/* ===== Locator.X — Investor Mindset & Emotional Intelligence ================
   A companion to the Graduate & Professional Certificate track (gradschool.js),
   same registration pattern, different subject: not the mathematics and law
   underneath the trade, but the cognitive and emotional discipline underneath
   the decisions. Every number this app computes still has to pass through a
   human being who is tired, anchored by the last price they saw, and afraid
   of being wrong in front of a client — this track is about that layer.

   SOURCING RULE, identical to gradschool.js: every lesson here is ORIGINAL
   Locator.X writing. Named researchers and frameworks (Kahneman & Tversky's
   prospect theory, Goleman's emotional-intelligence model, Shefrin & Statman's
   disposition-effect work) are cited as real, findable further reading —
   never quoted at length, never reskinned, never presented as text this
   track copied from them. No named researcher, publisher or institution has
   reviewed, endorsed, sponsored or is affiliated with this track.

   Like gradschool.js, this file only APPENDS to window.LXTC.TRACKS — it does
   not touch tradecraft.js, so progress tracking, the 'lxtradecraft' storage
   key and the existing rendering all pick this track up for free. */
(function(){
'use strict';
var TRACK_ID = 'mindset';

var FURTHER = {
  kt1979: 'Kahneman & Tversky, "Prospect Theory: An Analysis of Decision under Risk," Econometrica 47(2), 1979 — the original loss-aversion and reference-point paper.',
  kahneman2011: 'Daniel Kahneman, Thinking, Fast and Slow (2011) — the System 1 / System 2 framework this lesson uses, in the author’s own full treatment.',
  shefrinstatman: 'Shefrin & Statman, "The Disposition to Sell Winners Too Early and Ride Losers Too Long," Journal of Finance 40(3), 1985 — the original disposition-effect study.',
  goleman1995: 'Daniel Goleman, Emotional Intelligence (1995) — the five-component model (self-awareness, self-regulation, motivation, empathy, social skill) this lesson draws its structure from.',
  galinsky: 'Galinsky & Mussweiler, "First Offers as Anchors: The Role of Perspective-Taking and Negotiator Focus," Journal of Personality and Social Psychology 81(4), 2001 — anchoring specifically in negotiation, not just estimation.'
};
function reading(keys){
  return '<p class="src" style="margin-top:10px"><b>Further reading, freely accessible or in print, not required and not reproduced here:</b><br>'
    + keys.map(function(k){ return esc(FURTHER[k]); }).join('<br>') + '</p>';
}
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s == null ? '' : s)); };

var TRACK = {
  id: TRACK_ID, name: 'Investor mindset & emotional intelligence', slot: 13,
  blurb: 'The cognitive and emotional layer underneath every number this app computes. Five lessons on the '
    + 'decision biases that misprice real estate specifically — loss aversion, anchoring, overconfidence, '
    + 'panic under drawdown — and the emotional-intelligence discipline that catches them, each tied to a '
    + 'specific feature already in this app that exists precisely because the bias is real. Original Locator.X '
    + 'writing; named researchers cited as further reading, never quoted at length, with no endorsement implied.',
  modules: [
  {id: 'm1', t: 'Two systems, one closing table: why this app fights your own brain on purpose', body: `
   <p>Daniel Kahneman's dual-process framework splits judgment into two systems: <b>System 1</b> is fast,
   automatic, pattern-matching, and runs by default — it is what tells you a listing photo "feels" overpriced
   before you have read a single comp. <b>System 2</b> is slow, effortful, and has to be deliberately engaged —
   it is what actually divides NOI by a cap rate. System 1 is not a flaw to eliminate; it is fast for a reason and
   right more often than chance. The problem is specific: certain decision shapes reliably fool it, and real
   estate investing is unusually rich in exactly those shapes — large infrequent decisions, long feedback
   delays (you find out if the cap rate was right in years, not seconds), and numbers big enough to trigger fear
   and excitement that a stock-screener click never does.</p>
   <p>This is not an abstract caveat. It is the reason several features already in this app exist in the shape
   they do. The backtest-before-forecast discipline on the Predictions tab (<code>LXPredict</code>) is a System-2
   check bolted in front of a System-1-friendly line-going-up chart. The DSCR floor this app surfaces before cash
   flow is a pre-committed threshold, decided before a specific deal's excitement is in the room. Both are covered
   in the lessons that follow, each next to the specific bias it exists to counter.</p>`,
   drill: {q: 'Per Kahneman’s framework, why is real estate investing an unusually good environment for System-1 errors to go uncorrected?',
     opts: ['Because the numbers are always small enough to check in your head',
       'Because decisions are large, infrequent, and the feedback on whether a judgment was right arrives years later — System 1 rarely gets corrected by fast, repeated feedback the way it would in a quicker-cycle decision',
       'Because System 1 is always wrong and System 2 is always right', 'Because real estate has no data to reason from'],
     a: 1, why: 'System 1 is normally kept honest by fast, repeated feedback. Real estate’s long cycle length and high stakes remove that correction mechanism, which is exactly why a deliberate, external check — a backtest, a pre-committed floor — has to do the job feedback would otherwise do.'},
   x: reading(['kahneman2011'])},
  {id: 'm2', t: 'Loss aversion and the disposition effect: why the cone on the Predictions tab is drawn wide on purpose', body: `
   <p>Kahneman and Tversky's prospect theory found that losses are felt roughly <b>twice as intensely</b> as
   equivalent gains — not a rounding difference, a structural asymmetry in how the same dollar amount registers
   depending on which side of a reference point it falls. Applied to a held asset, Shefrin and Statman's later work
   documented the practical consequence directly: investors sell winners too early, to lock in the good feeling of
   a realized gain, and hold losers too long, because selling at a loss requires admitting the loss is real. Real
   estate makes this worse than a liquid stock, not better — there is no daily mark forcing the question, so a
   losing position can be quietly not-sold for years under the story that it will "come back."</p>
   <p>This is the direct reason the Predictions tab's projection cone is drawn from the <i>measured</i> backtest
   error rather than a reassuring flat line, and the reason it says plainly when a method is "NOT reliable at this
   horizon" instead of hiding a bad number behind a narrow-looking band. A narrow, confident-looking forecast is
   exactly the kind of System-1-friendly picture that makes holding a loser feel safer than it is. The honest,
   sometimes-wide cone is a deliberate refusal to manufacture that comfort.</p>`,
   drill: {q: 'An investor is unwilling to sell a property at a modest loss despite better opportunities elsewhere, saying "it will come back." What does the disposition effect predict about this pattern, and what in this app is built specifically against it?',
     opts: ['This is rational patience, and nothing in the app addresses it',
       'This is the well-documented tendency to hold losers too long because realizing a loss is more painful than an equivalent unrealized loss — the app’s backtest-derived (not reassuring) projection bands and honest "not reliable at this horizon" verdicts are built to resist exactly this kind of comfortable self-story',
       'This only happens with stocks, never real estate', 'The app has no feature relevant to this bias'],
     a: 1, why: 'The disposition effect is specifically about the asymmetry between realized and unrealized losses driving holding behavior. A forecast tool that refuses to look more confident than its backtest earns is a direct, structural counter to the comfortable story that keeps a losing position held.'},
   x: reading(['kt1979', 'shefrinstatman'])},
  {id: 'm3', t: 'Anchoring at the negotiation table: why the first number said in a room outweighs the facts that follow', body: `
   <p>Anchoring is the tendency for an initial number — even one known to be arbitrary — to pull every
   subsequent judgment toward it. Galinsky and Mussweiler's negotiation-specific research found the effect is not
   just an estimation quirk: the <b>first offer in a negotiation</b> measurably shifts the final agreed price
   toward itself, for both the person who made the offer and, more surprisingly, often for the person who did not.
   A seller who opens 15% over comparable sales is not just hoping — they are running a documented cognitive
   exploit, whether they know the research or not.</p>
   <p>The counter is not "ignore the anchor," which does not work — anchors affect judgment even when the
   person knows they are arbitrary. The counter is arriving with a competing, evidence-built anchor of your own
   before the conversation starts. This is precisely the job the Comps tab and the ZIP-level Zillow index do in
   this app: a defensible, evidence-weighted number, formed before a counterparty's opening offer is in the room,
   is what keeps a negotiation anchored to facts instead of to whoever spoke first. Walking into a negotiation
   having only skimmed a listing is walking in with no anchor of your own — which means the other side's
   anchor wins by default, not by being right.</p>`,
   drill: {q: 'A seller opens negotiation at a price well above nearby comps. Per anchoring research, what is the single most effective countermeasure, and why does simply "knowing about anchoring" not fully solve the problem?',
     opts: ['Refuse to name any number, to avoid being anchored at all',
       'Arrive with your own evidence-built number — formed from comps and the ZIP index before the conversation — because anchoring measurably affects judgment even in people who are aware of the effect, so awareness alone is not a sufficient defense; a competing anchor is',
       'Always accept the first offer to end the negotiation quickly', 'Anchoring does not apply to real estate negotiations'],
     a: 1, why: 'Galinsky and Mussweiler’s finding that awareness does not neutralize anchoring is the key point: the defense has to be structural (arriving with your own founded number) rather than purely mental (telling yourself not to be influenced).'},
   x: reading(['galinsky'])},
  {id: 'm4', t: 'Overconfidence and the illusion of a clean number: why this app refuses to sound more certain than its backtest', body: `
   <p>Overconfidence in judgment under uncertainty is one of the most replicated findings in decision research: a
   single point estimate — "this property will be worth $940,000 in three years" — <i>feels</i> more
   credible than a range, precisely because it sounds more precise, even when the person stating it has no basis
   for that precision. A range that is honestly wide reads as less confident and, perversely, less trustworthy to
   a System-1 read of the situation — even when the range is the only part that is actually true.</p>
   <p>This is the exact failure mode the Predictions tab's own governing rule is written against: every projection
   is run backwards against real held-out months before it is drawn forward, and where the backtest is weak the
   page says the method does not work for that series <b>rather than drawing it prettier</b>. That sentence is a
   direct policy against overconfidence, stated as engineering rather than psychology — and reading it as
   psychology is the point of this lesson. The discipline of "state the band you actually measured, not the band
   that would look reassuring" is emotional intelligence applied to software: it is the tool declining to
   perform a confidence it has not earned, on your behalf, so you do not have to un-learn a false certainty later.</p>`,
   drill: {q: 'Why might a wide, honestly-measured projection band feel LESS trustworthy than a single confident number, even though the band is the more accurate representation?',
     opts: ['Because wide bands are always mathematically wrong', 'Because a single precise-sounding number exploits the same overconfidence bias that makes precision feel like credibility — the band is harder to act on emotionally but is the part that is actually true',
       'Because investors cannot read charts with a range', 'There is no difference in trustworthiness; this is not a real effect'],
     a: 1, why: 'Overconfidence research shows precision is mistaken for accuracy by default. A tool that resists this — by reporting the real backtest-measured error instead of a falsely narrow band — is choosing honesty over the more persuasive-feeling but less true alternative.'},
   x: reading(['kahneman2011'])},
  {id: 'm5', t: 'Self-regulation under drawdown: Goleman’s framework and the pre-committed floor', body: `
   <p>Goleman's emotional-intelligence model names five components: self-awareness, <b>self-regulation</b>,
   motivation, empathy, and social skill. Self-regulation — the ability to manage disruptive emotion and
   impulse, particularly under stress — is the component most directly tested by a real-estate drawdown: a
   vacancy runs long, a rent roll comes in under pro forma, and the emotionally available options are exactly the
   wrong two — panic-sell into a soft market, or freeze and do nothing while the DSCR erodes further.</p>
   <p>The documented antidote to poor in-the-moment self-regulation is not willpower exercised in the moment; it
   is a <b>pre-committed threshold</b> decided before the stress arrives, when judgment is clear. This app already
   embeds that idea structurally: the DSCR floor a lender reads first, the coverage ratio surfaced before cash
   flow anywhere underwriting happens, is a number an investor can set — and hold themselves to — before a
   specific vacancy is making next month's decision feel urgent. A floor decided under stress is not a floor; it
   is a rationalization with a number attached. A floor decided in advance, and referred back to under stress, is
   what self-regulation looks like in a spreadsheet.</p>`,
   drill: {q: 'A property’s DSCR drops to 1.05 during a rough quarter. Per the self-regulation research this lesson describes, what makes a pre-set 1.20 DSCR floor useful in that moment, versus deciding what to do only once the number has already dropped?',
     opts: ['It guarantees the property will recover', 'It removes the decision from the moment of highest stress: the threshold was set when judgment was clear, so the investor is executing a plan rather than improvising an emotional response while afraid',
       'DSCR floors have no relationship to emotional decision-making', 'It is only useful for lenders, never for the owner’s own decisions'],
     a: 1, why: 'The self-regulation research this lesson cites is specific: pre-committed thresholds work because they move the hard decision to a calm moment, rather than asking willpower to win a fight against fear in real time — which is a fight it reliably loses.'},
   x: reading(['goleman1995'])}
  ]
};
TRACK.modules.forEach(function(m){ if(m.x){ m.body = m.body + m.x; delete m.x; } });

function register(){
  if(!window.LXTC || !window.LXTC.TRACKS) return false;
  if(window.LXTC.TRACKS.some(function(t){ return t.id === TRACK_ID; })) return true;
  window.LXTC.TRACKS.push(TRACK);
  return true;
}
var mounted = false;
function mount(){ if(mounted) return; mounted = true; register(); }
document.addEventListener('DOMContentLoaded', mount);
setTimeout(mount, 1000);

window.LXMindset = {register: register, TRACK: TRACK};
})();
