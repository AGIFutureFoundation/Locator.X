/* ===== Locator.X — Emotional equity & relationships ========================
   Track 17. The foundation pillar: the relationship work that decides which
   deals you are shown, which terms you are offered, and who takes your call in
   a bad year. Organised around the EQUITY framework — Earn it, Questions before
   positions, Understand who decides, Invest before you need it, Tell the truth
   early, Yield the small things.

   This track exists because the platform's sixth doctrine principle does:
   relationships are the deal flow, and goodwill compounds. Everything in the
   other sixteen tracks is executed through people, and none of those tracks
   teaches the people.

   SOURCING RULE, identical to the rest of the Academy: original Locator.X
   writing. No third-party book, course, syllabus or programme is copied,
   paraphrased at length, reskinned or adapted, and no institution or provider
   named or unnamed has reviewed, endorsed, sponsored or is affiliated with it.
   Completing it confers no accredited qualification. Appends to LXTC.TRACKS. */
(function(){
'use strict';
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s == null ? '' : s)); };
var TRACK_ID = 'equity';

function builds(s){
  return '<p class="src" style="margin-top:10px"><b>Builds on, in this Academy:</b> ' + esc(s) + '</p>';
}
function letter(l, name){
  return '<p class="src" style="margin-top:10px"><b>EQUITY framework:</b> ' + esc(l) + ' &mdash; ' + esc(name) + '</p>';
}

var TRACK = {
  id: TRACK_ID, name: 'Emotional equity & relationships', slot: 17,
  blurb: 'The foundation pillar. Eight lessons on the capital account nobody keeps &mdash; the trust that '
    + 'gets deposited, drawn down and compounded, and that prices every term you are offered. Built on the '
    + 'EQUITY framework: Earn it before you need it, Questions before positions, Understand who decides, '
    + 'Invest first, Tell the truth early, Yield the small things. Original Locator.X writing; nothing '
    + 'adapted from any third-party programme, no accredited qualification.',
  modules: [

  {id: 'q1', t: 'The balance sheet nobody keeps', body: `
   <p>Every operator carries two balance sheets. One is audited, financed against and discussed constantly.
   The other is never written down, and it decides more of your outcomes than the first one does.</p>
   <p><b>Emotional equity is a capital account.</b> It is deposited when you do what you said you would do,
   pay when you said you would pay, and decide when you said you would decide. It is drawn down when you are
   late, vague, or absent at the moment somebody needed an answer. And like any account, it can go into an
   overdraft you cannot see — because the people you have overdrawn with simply stop calling, and nobody sends
   you a statement saying why.</p>
   <p><b>Four accounts, not one.</b> Counterparties — sellers, buyers, brokers. Capital — lenders, partners,
   investors. Trades — contractors, subs, property managers. Community — the municipality, the neighbours, the
   tenants. Most operators run a healthy balance in one and an overdraft in another without noticing, because
   the accounts do not net against each other. A reputation for paying trades late is not offset by being
   pleasant to lenders.</p>
   <p><b>Why this is not "being nice."</b> Nice is a manner. This is a ledger. The test is not whether people
   enjoy working with you; it is whether they would extend you something — a first look, an extra week, a rate
   held through a rocky appraisal — that they would not extend to a stranger with identical numbers. That
   difference is the balance, and it is measurable the moment you need it.</p>
   <p><b>The framework this track runs on.</b> <b>E</b>arn it before you need it. <b>Q</b>uestions before
   positions. <b>U</b>nderstand who decides. <b>I</b>nvest first. <b>T</b>ell the truth early. <b>Y</b>ield the
   small things. Six practices, one per lesson, and the acronym is the point: it spells the thing it builds.</p>
   <p><b>The exercise.</b> Write your four accounts. Under each, name three people and one honest sentence
   about your current balance with them. Most people find one overdraft they were not thinking about, and it is
   usually in trades or community — the two nobody performs for.</p>`,
   drill: {q: 'What separates emotional equity from simply having good manners with people you work with?',
     opts: ['Nothing meaningful — they describe the same thing',
       'Emotional equity is about being liked; manners are about being polite',
       'It is a balance that can be drawn against: the test is whether someone would extend you something — a first look, an extra week, a rate held — that they would not extend to a stranger with identical numbers',
       'Emotional equity applies only to business relationships, manners to personal ones'],
     a: 2, why: 'A manner costs nothing and buys nothing. A balance is built by kept commitments and spent when you need something the numbers alone would not get you. That is why it behaves like capital — it is accumulated deliberately, it is finite, and it is only proved at the moment you draw on it.'},
   x: letter('The ledger', 'the account underneath all six practices')
      + builds('Investor mindset & emotional intelligence, the whole track; Delivering the project p5 on leading people who do not work for you.')},

  {id: 'q2', t: 'E — Earn it before you need it: predictability as strategy', body: `
   <p>The cheapest competitive advantage in this business is being someone whose behaviour can be predicted.
   Not brilliant, not charming — <b>predictable</b>. It costs nothing and almost nobody does it consistently.</p>
   <p><b>Three behaviours, and they are unglamorous.</b> Pay on the day you said. Decide within the window you
   promised, including deciding no. Answer the message you do not want to answer. A contractor deciding whose
   job gets the good crew next month is not weighing your vision; they are weighing whether your last three
   invoices cleared on time.</p>
   <p><b>Reputation prices your terms, and you never see the memo.</b> A lender's internal credit write-up
   contains a paragraph about the sponsor. You do not get to read it, you do not get to correct it, and it
   moves your rate, your recourse and your reserve requirement. It is written from the last several times
   somebody at that institution dealt with you or heard about you. The identical deal genuinely gets different
   terms for different people, and that gap is not unfairness — it is a priced risk assessment of you.</p>
   <p><b>Earn it before you need it, because you cannot earn it during.</b> The moment you need a favour is
   precisely the moment your motives are obvious. Deposits made when you wanted nothing are the only ones that
   count when you do.</p>
   <p><b>Recovering from a broken commitment.</b> You will break one. The recovery is mechanical and most
   people get it wrong by delaying: say it early, say specifically what happened without a narrative, say what
   you are doing about it, and then do that. One clean recovery can leave the balance higher than before,
   because it demonstrates the thing a smooth run never tests.</p>
   <p><b>Where the platform touches this.</b> The same discipline that makes the Record Locker useful — write
   down what was decided and when — is what makes you predictable to other people. A decision you can
   reconstruct is a commitment you can honour.</p>`,
   drill: {q: 'Why is predictability described as the cheapest advantage available to a small operator?',
     opts: ['Because it impresses counterparties more than competence does',
       'Because it costs nothing but consistency, yet it directly changes the terms offered — the good crew, the held rate, the first look all go to whoever the other party can forecast, and almost nobody sustains it',
       'Because predictable operators can charge higher prices',
       'Because it eliminates the need to negotiate'],
     a: 1, why: 'Every other advantage — capital, market knowledge, relationships inherited — has an acquisition cost. Doing what you said costs only the discipline to keep saying only what you will do. It compounds precisely because so few sustain it, which is why the gap between operators on identical deals is so often behavioural rather than financial.'},
   x: letter('E', 'Earn it before you need it')
      + builds('Delivering the project p5 on predictability, clarity and reciprocity; the Record Locker.')},

  {id: 'q3', t: 'Q — Questions before positions: negotiating for the second deal', body: `
   <p>A position is what someone says they want. An interest is why. Positions collide; interests very often do
   not. A seller holding at a number may be protecting a tax event, a sibling, a closing date or a story they
   have told someone — and three of those four are cheaper for you to solve than the price gap.</p>
   <p><b>Ask before you counter.</b> "What does the right outcome look like for you?" and then, harder, be
   quiet. Most negotiators fill the silence with a concession nobody asked for. The information you get in
   those ten seconds is worth more than the concession you were about to make.</p>
   <p><b>The anchor is real, and it is not a trick you can opt out of.</b> The first number said in a room pulls
   every subsequent number toward it, including yours, including when you know it is happening. The practical
   defences are two: decide your walk-away in writing before the conversation, and when an anchor lands far
   outside it, do not counter near it — reset to your own frame with your own arithmetic.</p>
   <p><b>Negotiate for the sequence, not the transaction.</b> Terms are agreed once. The relationship is priced
   every time. Winning the last 1.5% from a broker who will see two hundred deals before you see twenty is the
   most expensive victory available to you. The question that reframes it: <i>what does this person need to be
   able to say to their side?</i> Give them that, and you will be shown the next one first.</p>
   <p><b>Walking away without closing the door.</b> "This does not work at this price for me, and here is the
   arithmetic — if anything changes, call me first." You have declined, explained, and stayed on the list. The
   deal you lose cleanly is often the deal that comes back in ninety days.</p>`,
   drill: {q: 'A seller will not move off a price. Before countering, what is the highest-value move?',
     opts: ['Improve your offer slightly to signal good faith',
       'Restate your own valuation with more supporting comparables',
       'Ask what the right outcome looks like for them and then stay quiet — the position may be protecting a timing, tax or family interest that is cheaper for you to solve than the price gap, and the answer costs you nothing to obtain',
       'Set a deadline to create urgency'],
     a: 2, why: 'Countering trades against a position you do not understand, and it spends money to buy information you could have asked for free. Interests are frequently non-price — a closing date, a rent-back, a tax year, a co-owner who needs to feel consulted. You cannot solve for them until you know them, and most sellers will simply tell you.'},
   x: letter('Q', 'Questions before positions')
      + builds('Investor mindset m3 on anchoring at the negotiation table; Capital & structure c2 “The seller is a lender you have not asked yet”.')},

  {id: 'q4', t: 'U — Understand who decides: the map, and reading the room', body: `
   <p>Draw the eight people who determine whether your next deal happens. Landowner, broker, lender, partner,
   contractor, municipality, tenant, neighbour. Now mark two things on each: <b>what they are optimising</b>,
   and whether they are a <b>gate</b> (they can stop it) or a <b>bridge</b> (they can connect you onward).
   People manage gates and neglect bridges, and bridges are where deal flow comes from.</p>
   <p><b>The broker relationship is an information relationship.</b> Brokers are not paid to find you a bargain;
   they are paid to close. What you can offer that most buyers cannot is certainty and speed, and what you get
   back is the call before the listing. That trade is explicit — say it out loud, then be worth it once.</p>
   <p><b>Lenders remember you longer than they remember the deal.</b> Individual transactions blur; sponsors do
   not. The relationship you build across three ordinary loans is what gets underwritten sympathetically on the
   fourth one that is not ordinary.</p>
   <p><b>Emotion is unpublished market data.</b> A seller's urgency, a lender's hesitation and a contractor who
   has gone quiet are all signal, and none of it is in any feed. A lender growing cautious about a submarket is
   telling you something about the cycle weeks before it shows in a price series. A contractor who stops
   returning calls is usually telling you they are overcommitted, which is a schedule risk that has already
   happened.</p>
   <p><b>Separate their signal from your state.</b> The discipline is to write down what you read and why,
   at the time — because after the outcome you will remember having known. This is the same reason the platform
   records coverage on a screen rather than a conclusion: an impression you cannot check later is not evidence,
   and a read you never wrote down cannot teach you whether you read well.</p>`,
   drill: {q: 'On a relationship map, why is distinguishing "gates" from "bridges" more useful than ranking people by seniority?',
     opts: ['Because senior people are usually unavailable anyway',
       'Because gates can stop a deal and bridges can connect you onward — they need entirely different treatment, and operators reliably over-manage the gates in front of them while neglecting the bridges that produce the next deal',
       'Because bridges are more important than gates in every case',
       'Because seniority is not knowable from outside an organisation'],
     a: 1, why: 'Seniority describes an org chart; gate and bridge describe what a person can actually do to you or for you. The failure pattern is consistent: attention flows to whoever is currently blocking the live deal, and the people who could introduce the next three get nothing until they are needed — which is exactly when a deposit cannot be made.'},
   x: letter('U', 'Understand who decides')
      + builds('Investment & development i3 on the eight actors and six gates; Evidence & analysis e2 on framing before querying.')},

  {id: 'q5', t: 'I — Invest first: deposits, and the referral you send before you ask', body: `
   <p>The account only works in one direction at the start. Every relationship that later produces something
   began with a deposit made by somebody who wanted nothing at the time — and if you are waiting to be that
   somebody's beneficiary rather than that somebody, you will wait.</p>
   <p><b>Send the referral first.</b> The single highest-return act available to a small operator is
   introducing two people who should know each other, with no position in the outcome. It costs one message. It
   is remembered for years. And it is the only form of deposit that also increases the value of the network you
   are depositing into.</p>
   <p><b>Be worth mentoring.</b> Nobody owes you their time. What earns it is arriving with specific questions,
   having done the work, and — the part almost everyone skips — <b>reporting back</b> on what you did with the
   advice. The second conversation is granted on the strength of what you did after the first.</p>
   <p><b>What to do when you cannot help.</b> Say so quickly and precisely: "I do not know this, but the person
   who does is X." A fast honest no is a deposit. A slow vague maybe is a withdrawal, and most people make the
   second one while believing they are being kind.</p>
   <p><b>Community is a portfolio position.</b> The municipality, the neighbours and the tenants are
   counterparties across every deal you will do in a market, not just this one. Operators who treat the
   community as an obstacle to route around pay for it at the next hearing, and the bill arrives with interest
   at the gate they least control.</p>
   <p><b>The arithmetic.</b> A deposit costs minutes. A withdrawal you cannot make — because the balance is not
   there — costs a deal. That asymmetry is the entire case for investing first, and it is why this practice sits
   before the two that spend the account.</p>`,
   drill: {q: 'Why is sending a referral you have no stake in described as the highest-return act available to a small operator?',
     opts: ['Because the recipient is obliged to reciprocate with a referral of similar value',
       'Because it costs one message, is remembered for years, and uniquely also increases the value of the network you are depositing into — unlike most deposits, it improves the asset as well as the balance',
       'Because it generates immediate fee income',
       'Because it is the fastest way to become known to brokers'],
     a: 1, why: 'Obligation is the wrong model — a referral sent to create a debt is a transaction and is read as one. The compounding comes from two effects at once: the deposit with each party, and the fact that a better-connected network produces more opportunities for everyone in it, including you.'},
   x: letter('I', 'Invest before you need it')
      + builds('Delivering the project p5 on reciprocity over the long run; the Academy’s standing discipline of reporting back.')},

  {id: 'q6', t: 'T — Tell the truth early: money, delay and bad news', body: `
   <p>This is the practice that separates operators who survive a bad year from operators who do not, and it is
   almost entirely a matter of timing. The same bad news delivered on the day it is known and delivered three
   weeks later are two different events: the first is a problem you are managing, the second is a problem you
   concealed.</p>
   <p><b>The structure, every time.</b> What happened, stated plainly and without narrative. What it means, in
   numbers. What you are doing about it. What you need from them, if anything. Four parts, in that order, and
   the temptation to lead with context is the temptation to bury the headline.</p>
   <p><b>The partner call when a draw is late.</b> Partners forgive losses far more readily than they forgive
   finding out late. A partner who learns of a problem from you at week one is a partner solving it with you; a
   partner who learns at week four is a partner reassessing whether anything else is being managed the way they
   assumed.</p>
   <p><b>Tell everyone the same thing.</b> Tenant, lender and partner get the same facts, adjusted for what each
   needs to act on, never for what each would prefer to hear. Versions of a story that differ by audience always
   meet eventually, and they meet at the worst possible moment.</p>
   <p><b>Write the script before you need it.</b> The reason bad news gets delayed is that the conversation is
   composed under stress by somebody who wants to avoid it. Draft the call while nothing is wrong — the same
   logic as the trigger written into a risk register while you are calm, and for the same reason: the decision
   made in advance is the better decision.</p>
   <p><b>What silence costs.</b> An unanswered message is not neutral. The other party fills it, and they
   almost never fill it generously. "I do not have an answer yet, I will have one Thursday" preserves the
   balance that going quiet spends.</p>`,
   drill: {q: 'Why does the same bad news cost more when delivered three weeks late than on the day it is known?',
     opts: ['Because the financial damage has usually grown in the interval',
       'Because it changes category: early it is a problem being managed, late it is a problem that was concealed — and the counterparty must now re-examine everything else they assumed was being handled, which costs far more than the original issue',
       'Because contracts typically require prompt notification',
       'Because people are less sympathetic when they are surprised'],
     a: 1, why: 'The financial damage may not have grown at all. What changed is the inference available to the other party: they now have direct evidence that things go wrong here without being reported, and they cannot tell what else is currently in that state. You spend the balance on the concealment, not on the event.'},
   x: letter('T', 'Tell the truth early')
      + builds('Delivering the project p7 on triggers decided while calm; Investor mindset m5 on self-regulation under drawdown.')},

  {id: 'q7', t: 'Y — Yield the small things: concessions, partners and family money', body: `
   <p>Most of what people fight over in a deal is cheap to them and expensive to the other side, or the reverse.
   Finding those asymmetries is the whole craft, and yielding on them deliberately is how you buy the things
   that actually matter.</p>
   <p><b>The concession audit.</b> Before the conversation, list what you are asking for and mark each item:
   what it is worth to you, and what you believe it costs them. Anything cheap for you and valuable to them is
   currency — a closing date, a rent-back, which appliances stay, who announces what to whom. Spend all of it,
   openly, to buy the two or three items that are genuinely expensive for you.</p>
   <p><b>Winning the last small point is usually a loss.</b> It converts a counterparty who would have brought
   you the next deal into one who has satisfied their obligation to you. Price the relationship into the term
   sheet, because it is in there whether or not you account for it.</p>
   <p><b>Partners: the conversation before the entity.</b> Most partnerships fail on unspoken expectations
   rather than on the deal. Three things must be said out loud before any document exists: <b>money</b> — who
   puts in what, and what happens if someone cannot on a call; <b>time</b> — who does what work, and what it is
   worth; <b>decisions</b> — who decides what, and what happens when you disagree. Every partnership that
   collapsed over "he thought he was running it" skipped the third one.</p>
   <p><b>Family capital, and the cost of an unwritten deal.</b> Money from people who love you carries the same
   need for documentation as money from strangers, and more, because the downside is not only financial. The
   kindness is the paperwork: an unwritten family deal protects nobody and puts the relationship on the same
   line as the money. Have the exit conversation at the start, while everyone is optimistic and generous.</p>
   <p><b>Where the platform touches this.</b> The Investment Standard's third status is the same idea in
   another domain: a term you have not read is not neutral, it is <b>unpriced</b>. An expectation you have not
   said out loud is exactly that.</p>`,
   drill: {q: 'Why is insisting on documentation the *kind* choice when taking investment from family?',
     opts: ['Because it protects you legally if the relationship deteriorates',
       'Because unwritten expectations do not disappear — they surface later as a dispute in which the money and the relationship are on the same line, and writing terms down while everyone is optimistic is what keeps a bad outcome from becoming a family rupture',
       'Because family investors expect professional treatment',
       'Because lenders require all sources of capital to be documented'],
     a: 1, why: 'Framing it as self-protection misses the point and makes the conversation harder to have. The paperwork exists to make the downside survivable for both sides: what does not get written gets remembered differently, and the disagreement then runs through a relationship that has no mechanism for resolving it.'},
   x: letter('Y', 'Yield the small things')
      + builds('Investment & development i7 on control rights and the unpriced unknown; the Standard tab’s meets / fails / unknown.')},

  {id: 'q8', t: 'The long game: compounding, and the twenty-year relationship', body: `
   <p>The six practices are individually unremarkable. Their value is entirely in repetition, because emotional
   equity does not add — it <b>compounds</b>, and it compounds through a mechanism worth naming precisely.</p>
   <p><b>Why the curve bends.</b> A transactional operator gets roughly the same value from each deal: they
   find it, they fight for it, they close it, they start over. A relational operator gets something extra back
   from each one — a first look, a better rate, a contractor who fits them in, an introduction — and each of
   those makes the <i>next</i> deal cheaper to find and cheaper to execute. The returns feed the input. Over ten
   deals the gap is not a percentage; it is a different business.</p>
   <p><b>The market is smaller than it looks.</b> In any submarket the set of people who matter — brokers,
   lenders, inspectors, contractors, attorneys, assessors' offices — is a few dozen, and they talk. This is
   uncomfortable and it is also the whole opportunity: a few dozen people is a tractable number to be genuinely
   good to, and being good to them is not a strategy anyone can copy quickly.</p>
   <p><b>Judge the practice, not the year.</b> The account is invisible for a long time and then decisive all at
   once. Do not read a quiet stretch as evidence the deposits are not working, and do not read one good
   introduction as proof that they are. This is the same discipline the Academy applies to decisions and
   outcomes everywhere else: over a small number of events the noise dominates, and only the recorded practice
   tells you whether you were right for the right reasons.</p>
   <p><b>What it looks like at twenty years.</b> Deal flow you did not chase. Terms you did not have to argue
   for. A bad year in which four people take your call. None of it is on a balance sheet, all of it was
   deposited one unremarkable kept commitment at a time, and it is the only asset in this Academy that
   appreciates while you sleep and cannot be bought with capital.</p>`,
   drill: {q: 'What is the mechanism that makes relational dealing compound rather than simply add?',
     opts: ['Reputation attracts a premium price on exit',
       'Each deal returns something — a first look, better terms, an introduction — that makes the next deal cheaper to find and cheaper to execute, so the returns feed the input; transactional dealing starts over each time',
       'Relationships reduce transaction costs by a fixed percentage per deal',
       'Larger networks statistically produce more opportunities'],
     a: 1, why: 'Compounding requires the output to become input. A fixed saving per deal would be linear, and a bigger network alone is just a larger sample. The bend comes from each completed deal lowering the cost of the following one — which is why ten deals in produces a different business rather than a slightly better version of the same one.'},
   x: letter('The account', 'six practices, repeated until they compound')
      + builds('Investor mindset m4 on refusing false certainty; Delivering the project p8 on judging the decision rather than the outcome.')}
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
window.LXEquity = {register: register, TRACK: TRACK};
})();
