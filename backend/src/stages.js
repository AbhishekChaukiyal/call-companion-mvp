// Eight-stage cold-call guide, grounded in the supplied stage document and transcript patterns.
export const STAGES = [
  {
    "key": "opening",
    "number": 1,
    "name": "Opening",
    "purpose": "Reach the right person, say who you are, and earn a moment of attention. The prospect decides early whether this call is worth a minute.",
    "prompt": "Introduce yourself and your company plainly. Confirm you have the right person; if they are busy, agree a clear callback rather than pushing ahead.",
    "examples": [
      "Could you remind me who you are?",
      "I’m heading into a meeting; can we talk later?",
      "I don’t think this number belongs to the person you’re looking for."
    ],
    "taps": [
      {
        "key": "right_person",
        "label": "Reached the listed person"
      },
      {
        "key": "reception",
        "label": "Reception / assistant answered"
      },
      {
        "key": "unavailable",
        "label": "Busy — callback requested"
      },
      {
        "key": "wrong_person",
        "label": "Wrong person / left company"
      }
    ]
  },
  {
    "key": "purpose",
    "number": 2,
    "name": "Purpose",
    "purpose": "Explain in one or two sentences why you called, in words the prospect could repeat to a colleague.",
    "prompt": "Give a clear, specific reason for calling. If they ask what you do or why you have their number, answer directly instead of repeating a vague label.",
    "examples": [
      "What prompted your call?",
      "Can you explain what your company actually does?",
      "How did you find my contact details?"
    ],
    "taps": [
      {
        "key": "asked_reason",
        "label": "Asked what the call is about"
      },
      {
        "key": "asked_company",
        "label": "Asked what we do"
      },
      {
        "key": "asked_source",
        "label": "Asked where we got the number"
      },
      {
        "key": "purpose_understood",
        "label": "Purpose understood"
      }
    ]
  },
  {
    "key": "permission",
    "number": 3,
    "name": "Permission",
    "purpose": "Find out whether they are willing to talk now. A clear yes, a clear no, or a time to call back are all valid outcomes.",
    "prompt": "Look for an actual answer about timing. A request to call later is not permission to continue now; a short yes should not be treated as interest in the offer.",
    "examples": [
      "I can give you a minute; go ahead.",
      "Could you ring me after my meeting?",
      "Can you send a little context first?"
    ],
    "taps": [
      {
        "key": "permission_yes",
        "label": "Explicit yes — continue"
      },
      {
        "key": "callback_requested",
        "label": "Asked for a callback time"
      },
      {
        "key": "send_first",
        "label": "Asked for information first"
      },
      {
        "key": "permission_declined",
        "label": "Not willing to talk now"
      }
    ]
  },
  {
    "key": "their_business",
    "number": 4,
    "name": "Their business",
    "purpose": "Understand what the company does and the prospect’s part in it before saying much about your own company.",
    "prompt": "Listen for their industry, products, customers, remit, and corrections to your assumptions. Do not force their business into a story that does not fit.",
    "examples": [
      "We make components for commercial lighting.",
      "That work is handled by our head office.",
      "Most of our work is with public-sector customers."
    ],
    "taps": [
      {
        "key": "business_explained",
        "label": "Explained their business"
      },
      {
        "key": "assumption_corrected",
        "label": "Corrected our assumption"
      },
      {
        "key": "asked_about_caller",
        "label": "Asked us to explain ourselves"
      },
      {
        "key": "business_not_fit",
        "label": "Business context is not a fit"
      }
    ]
  },
  {
    "key": "their_need",
    "number": 5,
    "name": "Their need, in their words",
    "purpose": "Hear what they are trying to do or struggling with in their own words. This is the stage where the caller records exactly what was said.",
    "prompt": "Capture the prospect’s wording before interpreting it. Do not invent pain: a prospect who says the current business is working well may genuinely have no need.",
    "examples": [
      "We want to understand which product line has room to grow.",
      "Our current customer base is enough for now.",
      "Margins are tight on some of our orders."
    ],
    "taps": [
      {
        "key": "goal_stated",
        "label": "Stated a goal or challenge"
      },
      {
        "key": "no_need",
        "label": "Says things are fine / no need"
      },
      {
        "key": "asked_what_can_do",
        "label": "Asked what we could do"
      },
      {
        "key": "need_unclear",
        "label": "Need not established"
      }
    ]
  },
  {
    "key": "objection",
    "number": 6,
    "name": "Objection",
    "purpose": "Hear the reason for a no and understand it. A reason you understand can be answered now or next time; a reason you talked over cannot.",
    "prompt": "Acknowledge the concern first. If useful, ask one clarifying question; then respond briefly. Respect a clear refusal or request not to call.",
    "examples": [
      "Our group already works with an external consulting team.",
      "You’ll need to speak to the person who owns that area.",
      "Send a short overview first, then I’ll decide whether to revisit it."
    ],
    "taps": [
      {
        "key": "existing_solution",
        "label": "Already have a provider / team"
      },
      {
        "key": "wrong_contact",
        "label": "Not the right contact"
      },
      {
        "key": "written_info",
        "label": "Asked for written information"
      },
      {
        "key": "clear_no",
        "label": "Clear no / do not call"
      }
    ]
  },
  {
    "key": "next_step",
    "number": 7,
    "name": "Next step",
    "purpose": "Agree one concrete action: a document, a call at a named time, a meeting, or a referral. Name the action and its timing or channel.",
    "prompt": "Prefer the prospect’s time and channel. Distinguish an agreed action from a polite ‘send it’ with no stated follow-up or interest.",
    "examples": [
      "Try me Thursday afternoon.",
      "Send the overview to my work email.",
      "Our operations head is better placed to discuss this."
    ],
    "taps": [
      {
        "key": "meeting_time_agreed",
        "label": "Meeting / call time agreed"
      },
      {
        "key": "report_agreed",
        "label": "Report / information agreed"
      },
      {
        "key": "referral",
        "label": "Referred to another person"
      },
      {
        "key": "no_commitment",
        "label": "No concrete next step"
      }
    ]
  },
  {
    "key": "close",
    "number": 8,
    "name": "Close",
    "purpose": "End clearly and record what happened: the outcome, the next step, and the prospect’s words from stage 5. The record informs the next call.",
    "prompt": "Repeat the agreed action and timing, or record the refusal / disconnect accurately. A warm goodbye does not turn a no into a yes.",
    "examples": [
      "Let’s reconnect Tuesday afternoon.",
      "Thanks, but we’re not interested at present.",
      "I’m losing the connection; please try another time."
    ],
    "taps": [
      {
        "key": "commitment_confirmed",
        "label": "Commitment confirmed"
      },
      {
        "key": "declined",
        "label": "Declined / not interested"
      },
      {
        "key": "line_dropped",
        "label": "Line dropped / disconnected"
      },
      {
        "key": "outcome_mismatch",
        "label": "Logged outcome may not match"
      }
    ]
  }
];
