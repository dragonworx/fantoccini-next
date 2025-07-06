export class TimeSignature {
  // The note value that the signature is counting.
  // This number is always a power of 2 (unless the time signature is irrational),
  // usually 2, 4 or 8, but less often 16 is also used.
  // 2 corresponds to the half note (minim), 4 to the quarter note (crotchet),
  // 8 to the eighth note (quaver), 16 to the sixteenth note (semiquaver).
  readonly lower: number;
  // How many such note values constitute a bar.
  readonly upper: number;

  constructor(upper: number, lower: number) {
    this.upper = upper;
    this.lower = lower;
  }

  static get default(): TimeSignature {
    return TimeSignature.four_four;
  }

  static get four_four(): TimeSignature {
    return new TimeSignature(4, 4);
  }

  // Named constructor for three_four time signature
  static get three_four(): TimeSignature {
    return new TimeSignature(3, 4);
  }

  // Named constructor for two_four time signature
  static get two_four(): TimeSignature {
    return new TimeSignature(2, 4);
  }

  // Named constructor for six_eight time signature
  static get six_eight(): TimeSignature {
    return new TimeSignature(6, 8);
  }

  // Named constructor for five_four time signature
  static get five_four(): TimeSignature {
    return new TimeSignature(5, 4);
  }

  // Named constructor for nine_eight time signature
  static get nine_eight(): TimeSignature {
    return new TimeSignature(9, 8);
  }

  // Named constructor for twelve_eight time signature
  static get twelve_eight(): TimeSignature {
    return new TimeSignature(12, 8);
  }

  // Named constructor for seven_eight time signature
  static get seven_eight(): TimeSignature {
    return new TimeSignature(7, 8);
  }
}
