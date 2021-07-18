const BASE = 1e7,
  LOG_BASE = 7,
  MAX_INT = 9007199254740992,
  MAX_INT_ARR = [4740992, 719925, 90],
  DEFAULT_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz",
  LOBMASK_I = 1 << 30,
  LOBMASK_BI = ((BASE & -BASE) * (BASE & -BASE)) | LOBMASK_I;

interface PowersOfTwo {
  [key: number]: number | undefined;
  values: number[];
  length: number;
}

// This keeps the values from being generated until they're needed
const powersOfTwo = new Proxy(
  { values: [] as number[] },
  {
    get: function (target, name) {
      if (name === "values") return target.values;
      if (name === "length") return target.values.length;
      if (target.values.length === 0) {
        target.values = [2];
        while (2 * target.values[target.values.length - 1] <= BASE)
          target.values.push(2 * target.values[target.values.length - 1]);
      }
      return target.values[Number(name)];
    },
  }
) as PowersOfTwo;
const powers2Length = powersOfTwo.values.length;
const highestPower2: number = powersOfTwo[powers2Length - 1]!;

export type BigNumber = string | number | bigint | BigInteger;

export class BigInteger {
  public raw: bigint;

  public static zero = new BigInteger(0);
  public static one = new BigInteger(1);
  public static minusOne = new BigInteger(-1);

  constructor(value: BigNumber) {
    this.raw = BigInteger.parse(value);
  }

  public static from(value: BigNumber) {
    return new BigInteger(value);
  }

  public static fromArray(digits: number[], base: number, isNegative: boolean) {
    return BigInteger.parseBaseFromArray(
      digits.map(BigInteger.from),
      BigInteger.from(base || 10),
      isNegative
    );
  }

  private static parse(value: BigNumber) {
    const type = typeof value;
    switch (type) {
      case "number":
      case "string":
      case "bigint":
        return BigInt(value as number);
      default:
        return (value as BigInteger).raw;
    }
  }

  public add(other: BigNumber) {
    return new BigInteger(this.raw + BigInteger.parse(other));
  }

  public plus = this.add;

  public subtract(other: BigNumber) {
    return new BigInteger(this.raw - BigInteger.parse(other));
  }

  public minus = this.subtract;

  public negate() {
    return new BigInteger(-this.raw);
  }

  public abs() {
    return new BigInteger(this.raw >= 0 ? this.raw : -this.raw);
  }

  public multiply(other: BigNumber) {
    return new BigInteger(this.raw * BigInteger.parse(other));
  }

  public times = this.multiply;

  public square() {
    return new BigInteger(this.raw * this.raw);
  }

  public cube() {
    return new BigInteger(this.raw * this.raw * this.raw);
  }

  public divmod(other: BigNumber) {
    const x = this.raw;
    const y = BigInteger.parse(other);
    const [quotient, remainder] = [
      new BigInteger(x / y),
      new BigInteger(x % y),
    ];
    return { quotient, remainder };
  }

  public divide(other: BigNumber) {
    return new BigInteger(this.raw / BigInteger.parse(other));
  }

  public over = this.divide;

  public mod(other: BigNumber) {
    return new BigInteger(this.raw % BigInteger.parse(other));
  }

  public remainder = this.mod;

  public pow(other: BigNumber) {
    const n = new BigInteger(other);
    const a = this.raw;
    let b = n.raw;
    const _0 = BigInt(0),
      _1 = BigInt(1),
      _2 = BigInt(2);
    if (b === _0) return new BigInteger(1);
    if (a === _0) return new BigInteger(0);
    if (a === _1) return new BigInteger(1);
    if (a === BigInt(-1))
      return n.isEven() ? new BigInteger(1) : new BigInteger(-1);
    if (n.isNegative()) return new BigInteger(_0);
    // deno-lint-ignore no-this-alias
    let x: BigInteger = this;
    let y = new BigInteger(1);
    while (true) {
      if ((b & _1) === _1) {
        y = y.times(x);
        --b;
      }
      if (b === _0) break;
      b /= _2;
      x = x.square();
    }
    return y;
  }

  public modPow(exp: BigNumber, mod: BigNumber) {
    exp = new BigInteger(BigInteger.parse(exp));
    mod = new BigInteger(BigInteger.parse(mod));
    if (mod.isZero()) throw new Error("Cannot take modPow with modulus 0");
    var r = new BigInteger(1),
      base = this.mod(mod);
    if (exp.isNegative()) {
      exp = exp.multiply(new BigInteger(-1));
      base = base.modInv(mod);
    }
    while (exp.isPositive()) {
      if (base.isZero()) return new BigInteger(0);
      if (exp.isOdd()) r = r.multiply(base).mod(mod);
      exp = exp.divide(2);
      base = base.square().mod(mod);
    }
    return r;
  }

  public compareAbs(other: BigNumber) {
    var a = this.raw;
    var b = BigInteger.parse(other);
    a = a >= 0 ? a : -a;
    b = b >= 0 ? b : -b;
    return a === b ? 0 : a > b ? 1 : -1;
  }

  public compare(other: BigNumber) {
    if (other === Infinity) {
      return -1;
    }
    if (other === -Infinity) {
      return 1;
    }
    var a = this.raw;
    var b = BigInteger.parse(other);
    return a === b ? 0 : a > b ? 1 : -1;
  }

  public compareTo = this.compare;

  public equals(other: BigNumber) {
    return this.compare(other) === 0;
  }

  public eq = this.equals;

  public notEquals(other: BigNumber) {
    return this.compare(other) !== 0;
  }

  public neq = this.notEquals;

  public greater(other: BigNumber) {
    return this.compare(other) > 0;
  }

  public gt = this.greater;

  public lesser(other: BigNumber) {
    return this.compare(other) < 0;
  }

  public lt = this.lesser;

  public greaterOrEquals(other: BigNumber) {
    return this.compare(other) >= 0;
  }

  public geq = this.greaterOrEquals;

  public lesserOrEquals(other: BigNumber) {
    return this.compare(other) <= 0;
  }

  public leq = this.lesserOrEquals;

  public isEven() {
    return (this.raw & BigInt(1)) === BigInt(0);
  }

  public isOdd() {
    return (this.raw & BigInt(1)) === BigInt(1);
  }

  public isPositive() {
    return this.raw > 0;
  }

  public isNegative() {
    return this.raw < 0;
  }

  public isUnit() {
    return this.abs().raw === BigInt(1);
  }

  public isZero() {
    return this.raw === BigInt(0);
  }

  public isDivisibleBy(other: BigNumber) {
    const n = new BigInteger(other);
    if (n.isZero()) return false;
    if (n.isUnit()) return true;
    if (n.compareAbs(2) === 0) return this.isEven();
    return this.mod(n).isZero();
  }

  public isPrime(strict?: boolean) {
    var isPrime = BigInteger.isBasicPrime(this);
    if (isPrime !== undefined) return isPrime;
    var n = this.abs();
    var bits = n.bitLength();
    if (bits.lesserOrEquals(64))
      return BigInteger.millerRabinTest(
        n,
        [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]
      );
    var logN = Math.log(2) * bits.toJSNumber();
    var t = Math.ceil(strict === true ? 2 * Math.pow(logN, 2) : logN);
    const a: BigNumber[] = [];
    for (let i = 0; i < t; i++) {
      a.push(new BigInteger(i + 2));
    }
    return BigInteger.millerRabinTest(n, a);
  }

  public isProbablePrime(iterations: number, rng?: () => number) {
    const isPrime = BigInteger.isBasicPrime(this);
    if (isPrime !== undefined) return isPrime;
    const n = this.abs();
    const t = iterations === undefined ? 5 : iterations;
    const a: BigNumber[] = [];
    for (let i = 0; i < t; i++) {
      a.push(BigInteger.randBetween(2, n.minus(2), rng));
    }
    return BigInteger.millerRabinTest(n, a);
  }

  public modInv(n: BigNumber) {
    var t = BigInteger.zero,
      newT = BigInteger.one,
      r = new BigInteger(n),
      newR = this.abs(),
      q,
      lastT,
      lastR;
    while (!newR.isZero()) {
      q = r.divide(newR);
      lastT = t;
      lastR = r;
      t = newT;
      r = newR;
      newT = lastT.subtract(q.multiply(newT));
      newR = lastR.subtract(q.multiply(newR));
    }
    if (!r.isUnit())
      throw new Error(
        this.toString() + " and " + n.toString() + " are not co-prime"
      );
    if (t.compare(0) === -1) {
      t = t.add(n);
    }
    if (this.isNegative()) {
      return t.negate();
    }
    return t;
  }

  public next() {
    return new BigInteger(this.raw + BigInt(1));
  }

  public prev() {
    return new BigInteger(this.raw - BigInt(1));
  }

  public shiftLeft(amount: BigNumber): BigInteger {
    let n = BigInteger.from(amount).toJSNumber();
    if (!(Math.abs(n) <= BASE)) {
      throw new Error(String(n) + " is too large for shifting.");
    }
    if (n < 0) return this.shiftRight(-n);
    // deno-lint-ignore no-this-alias
    let result: BigInteger = this;
    if (result.isZero()) return result;
    while (n >= powers2Length) {
      result = result.multiply(highestPower2);
      n -= powers2Length - 1;
    }
    return result.multiply(powersOfTwo[n]!);
  }

  public shiftRight(amount: BigNumber) {
    let remQuo;
    let n = BigInteger.from(amount).toJSNumber();
    if (!(Math.abs(n) <= BASE)) {
      throw new Error(String(n) + " is too large for shifting.");
    }
    if (n < 0) return this.shiftLeft(-n);
    // deno-lint-ignore no-this-alias
    let result: BigInteger = this;
    while (n >= powers2Length) {
      if (result.isZero() || (result.isNegative() && result.isUnit()))
        return result;
      remQuo = this.divmod(highestPower2);
      result = remQuo.remainder.isNegative()
        ? remQuo.quotient.prev()
        : remQuo.quotient;
      n -= powers2Length - 1;
    }
    remQuo = this.divmod(powersOfTwo[n]!);
    return remQuo.remainder.isNegative()
      ? remQuo.quotient.prev()
      : remQuo.quotient;
  }

  public not() {
    return this.negate().prev();
  }

  public and(other: BigNumber) {
    return BigInteger.bitwise(this, other, (a, b) => a & b);
  }

  public or(other: BigNumber) {
    return BigInteger.bitwise(this, other, (a, b) => a | b);
  }

  public xor(other: BigNumber) {
    return BigInteger.bitwise(this, other, (a, b) => a ^ b);
  }

  public bitLength() {
    // deno-lint-ignore no-this-alias
    let n: BigInteger = this;
    if (n.compareTo(BigInteger.from(0)) < 0) {
      n = n.negate().subtract(BigInteger.from(1));
    }
    if (n.compareTo(BigInteger.from(0)) === 0) {
      return BigInteger.from(0);
    }
    return BigInteger.from(
      BigInteger.integerLogarithm(n, BigInteger.from(2)).e
    ).add(BigInteger.from(1));
  }

  public toArray(radix: number) {
    return BigInteger.toBase(this, radix);
  }

  public toString(radix?: number, alphabet?: string) {
    if (radix === undefined) radix = 10;
    if (radix !== 10) return BigInteger.toBaseString(this, radix, alphabet);
    return String(this.raw);
  }

  public toJSON = this.toString;

  public valueOf(): number {
    return parseInt(this.toString(), 10);
  }

  public toJSNumber = this.valueOf;

  public static max(a: BigNumber, b: BigNumber) {
    a = BigInteger.from(a);
    b = BigInteger.from(b);
    return a.greater(b) ? a : b;
  }

  public static min(a: BigNumber, b: BigNumber) {
    a = BigInteger.from(a);
    b = BigInteger.from(b);
    return a.lesser(b) ? a : b;
  }

  public static gcd(a: BigNumber, b: BigNumber) {
    a = BigInteger.from(a).abs();
    b = BigInteger.from(b).abs();
    if (a.equals(b)) return a;
    if (a.isZero()) return b;
    if (b.isZero()) return a;
    var c = BigInteger.one,
      d,
      t;
    while (a.isEven() && b.isEven()) {
      d = BigInteger.min(BigInteger.roughLOB(a), BigInteger.roughLOB(b));
      a = a.divide(d);
      b = b.divide(d);
      c = c.multiply(d);
    }
    while (a.isEven()) {
      a = a.divide(BigInteger.roughLOB(a));
    }
    do {
      while (b.isEven()) {
        b = b.divide(BigInteger.roughLOB(b));
      }
      if (a.greater(b)) {
        t = b;
        b = a;
        a = t;
      }
      b = b.subtract(a);
    } while (!b.isZero());
    return c.isUnit() ? a : a.multiply(c);
  }

  public static lcm(a: BigNumber, b: BigNumber) {
    a = BigInteger.from(a).abs();
    b = BigInteger.from(b).abs();
    return a.divide(BigInteger.gcd(a, b)).multiply(b);
  }

  public static randBetween(a: BigNumber, b: BigNumber, rng?: () => number) {
    a = BigInteger.from(a);
    b = BigInteger.from(b);
    const usedRNG = rng || Math.random;
    const low = BigInteger.min(a, b),
      high = BigInteger.max(a, b);
    const range = high.subtract(low).add(1);
    const digits = BigInteger.toBase(range, BASE).value;
    const result = [];
    let restricted = true;
    for (let i = 0; i < digits.length; i++) {
      const top = restricted ? digits[i] : BASE;
      const digit = BigInteger.truncate(usedRNG() * top);
      result.push(digit);
      if (digit < top) restricted = false;
    }
    return low.add(BigInteger.fromArray(result, BASE, false));
  }

  private static parseBase(
    text: string,
    base: number,
    alphabet: string,
    caseSensitive: boolean
  ) {
    alphabet = alphabet || DEFAULT_ALPHABET;
    text = String(text);
    if (!caseSensitive) {
      text = text.toLowerCase();
      alphabet = alphabet.toLowerCase();
    }
    const length = text.length;
    const absBase = Math.abs(base);
    const alphabetValues: { [key: string]: number } = {};

    for (let i = 0; i < alphabet.length; i++) {
      alphabetValues[alphabet[i]] = i;
    }

    for (let i = 0; i < length; i++) {
      const c = text[i];
      if (c === "-") continue;
      if (c in alphabetValues) {
        if (alphabetValues[c] >= absBase) {
          if (c === "1" && absBase === 1) continue;
          throw new Error(c + " is not a valid digit in base " + base + ".");
        }
      }
    }

    const bigBase = BigInteger.from(base);
    const digits = [];
    const isNegative = text[0] === "-";

    for (let i = isNegative ? 1 : 0; i < text.length; i++) {
      const c = text[i];
      if (c in alphabetValues) digits.push(BigInteger.from(alphabetValues[c]));
      else if (c === "<") {
        const start = i;
        do {
          i++;
        } while (text[i] !== ">" && i < text.length);
        digits.push(BigInteger.from(text.slice(start + 1, i)));
      } else throw new Error(c + " is not a valid character");
    }

    return BigInteger.parseBaseFromArray(digits, bigBase, isNegative);
  }

  private static parseBaseFromArray(
    digits: BigInteger[],
    base: BigNumber,
    isNegative: boolean
  ) {
    let val = BigInteger.zero,
      pow = BigInteger.one;
    for (let i = digits.length - 1; i >= 0; i--) {
      val = val.add(digits[i]!.times(pow));
      pow = pow.times(base);
    }
    return isNegative ? val.negate() : val;
  }

  private static stringify(digit: number, alphabet?: string) {
    alphabet = alphabet || DEFAULT_ALPHABET;
    if (digit < alphabet.length) {
      return alphabet[digit];
    }
    return "<" + digit + ">";
  }

  private static toBase(n: BigInteger, _base: number) {
    const base = BigInteger.from(_base);
    if (base.isZero()) {
      if (n.isZero()) return { value: [0], isNegative: false };
      throw new Error("Cannot convert nonzero numbers to base 0.");
    }
    if (base.equals(-1)) {
      if (n.isZero()) return { value: [0], isNegative: false };
      if (n.isNegative())
        return {
          value: ([] as any[]).concat.apply(
            [],
            Array.apply(null, Array(-n.toJSNumber())).map(
              Array.prototype.valueOf,
              [1, 0]
            )
          ),
          isNegative: false,
        };

      const arr = Array.apply(null, Array(n.toJSNumber() - 1)).map(
        Array.prototype.valueOf,
        [0, 1]
      );
      arr.unshift([1]);
      return {
        value: ([] as any[]).concat.apply([] as any, arr),
        isNegative: false,
      };
    }

    let neg = false;
    if (n.isNegative() && base.isPositive()) {
      neg = true;
      n = n.abs();
    }
    if (base.isUnit()) {
      if (n.isZero()) return { value: [0], isNegative: false };

      return {
        value: Array.apply(null, Array(n.toJSNumber())).map(
          Number.prototype.valueOf,
          1
        ),
        isNegative: neg,
      };
    }
    const out: number[] = [];
    let left = n,
      divmod;
    while (left.isNegative() || left.compareAbs(base) >= 0) {
      divmod = left.divmod(base);
      left = divmod.quotient;
      let digit = divmod.remainder;
      if (digit.isNegative()) {
        digit = base.minus(digit).abs();
        left = left.next();
      }
      out.push(digit.toJSNumber());
    }
    out.push(left.toJSNumber());
    return { value: out.reverse(), isNegative: neg };
  }

  private static toBaseString(n: BigInteger, base: number, alphabet?: string) {
    var arr = BigInteger.toBase(n, base);
    return (
      (arr.isNegative ? "-" : "") +
      arr.value
        .map(function (x) {
          return BigInteger.stringify(x, alphabet);
        })
        .join("")
    );
  }

  private static roughLOB(n: BigInteger) {
    // get lowestOneBit (rough)
    const v = n.raw,
      x = v | BigInt(LOBMASK_I);
    return x & -x;
  }

  private static integerLogarithm(
    value: BigInteger,
    base: BigInteger
  ): { p: BigInteger; e: number } {
    if (base.compareTo(value) <= 0) {
      const tmp = BigInteger.integerLogarithm(value, base.square());
      const p = tmp.p;
      const e = tmp.e;
      const t = p.multiply(base);
      return t.compareTo(value) <= 0
        ? { p: t, e: e * 2 + 1 }
        : { p: p, e: e * 2 };
    }
    return { p: BigInteger.one, e: 0 };
  }

  private static bitwise(
    x: BigInteger,
    y: BigNumber,
    fn: (a: number, b: number) => number
  ) {
    y = BigInteger.from(y);
    const xSign = x.isNegative(),
      ySign = y.isNegative();
    let xRem = xSign ? x.not() : x,
      yRem = ySign ? y.not() : y;
    let xDigit = 0,
      yDigit = 0;
    let xDivMod = null,
      yDivMod = null;
    const result = [];
    while (!xRem.isZero() || !yRem.isZero()) {
      xDivMod = x.divmod(highestPower2);
      xDigit = xDivMod.remainder.toJSNumber();
      if (xSign) {
        xDigit = highestPower2 - 1 - xDigit; // two's complement for negative numbers
      }

      yDivMod = yRem.divmod(highestPower2);
      yDigit = yDivMod.remainder.toJSNumber();
      if (ySign) {
        yDigit = highestPower2 - 1 - yDigit; // two's complement for negative numbers
      }

      xRem = xDivMod.quotient;
      yRem = yDivMod.quotient;
      result.push(fn(xDigit, yDigit));
    }
    let sum =
      fn(xSign ? 1 : 0, ySign ? 1 : 0) !== 0
        ? BigInteger.from(-1)
        : BigInteger.from(0);
    for (let i = result.length - 1; i >= 0; i -= 1) {
      sum = sum.multiply(highestPower2).add(BigInteger.from(result[i]));
    }
    return sum;
  }

  private static isBasicPrime(v: BigInteger) {
    const n = v.abs();
    if (n.isUnit()) return false;
    if (n.equals(2) || n.equals(3) || n.equals(5)) return true;
    if (n.isEven() || n.isDivisibleBy(3) || n.isDivisibleBy(5)) return false;
    if (n.lesser(49)) return true;
    // we don't know if it's prime: let the other functions figure it out
  }

  private static millerRabinTest(n: BigInteger, a: BigNumber[]) {
    const nPrev = n.prev();
    let d,
      x,
      b = nPrev,
      r = 0;
    while (b.isEven()) (b = b.divide(2)), r++;
    next: for (let i = 0; i < a.length; i++) {
      if (n.lesser(a[i])) continue;
      x = new BigInteger(a[i]).modPow(b, n);
      if (x.isUnit() || x.equals(nPrev)) continue;
      for (d = r - 1; d != 0; d--) {
        x = x.square().mod(n);
        if (x.isUnit()) return false;
        if (x.equals(nPrev)) continue next;
      }
      return false;
    }
    return true;
  }

  private static truncate(n: number) {
    if (n > 0) return Math.floor(n);
    return Math.ceil(n);
  }
}

export const bigInt = (value: BigNumber) => new BigInteger(value);
