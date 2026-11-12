import { SipCalculationResult } from '../types';

export function computeSipOrLumpsum(
  amount: number,
  years: number,
  annualRatePct: number,
  mode: 'sip' | 'lumpsum' = 'sip'
): SipCalculationResult {
  const safeAmount = Math.max(0, amount);
  const safeYears = Math.max(1, years);
  const safeRate = Math.max(0, annualRatePct);

  if (mode === 'lumpsum') {
    const invested = safeAmount;
    const r = safeRate / 100;
    const fv = invested * Math.pow(1 + r, safeYears);
    const returns = Math.max(0, fv - invested);
    const investedPct = fv > 0 ? Math.round((invested / fv) * 100) : 100;
    const returnsPct = 100 - investedPct;
    return {
      invested: Math.round(invested),
      returns: Math.round(returns),
      total: Math.round(fv),
      investedPct,
      returnsPct
    };
  }

  // Monthly SIP compounding: Annuity Due (beginning-of-month instalments, Zerodha/Groww formula)
  const n = safeYears * 12;
  const i = safeRate / 100 / 12;
  const invested = safeAmount * n;
  let fv = invested;
  if (i > 0) {
    fv = safeAmount * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  }
  const returns = Math.max(0, fv - invested);
  const investedPct = fv > 0 ? Math.min(100, Math.max(0, Math.round((invested / fv) * 100))) : 100;
  const returnsPct = 100 - investedPct;

  return {
    invested: Math.round(invested),
    returns: Math.round(returns),
    total: Math.round(fv),
    investedPct,
    returnsPct
  };
}

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(val));
}

