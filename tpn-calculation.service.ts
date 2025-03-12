import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TpnCalculationService {
  // Lipid (20%) = 5 * dosing weight * lipid requirement
  calculateLipid(dosingWeight: number, lipidReq: number): number {
    return 5 * dosingWeight * lipidReq;
  }

  calculateMVI(dosingWeight: number, lipidReq: number): number {
    return lipidReq > 0 ? dosingWeight : 0;
  }

  calculateCelcel(dosingWeight: number, celcelFlag: number): number {
    return celcelFlag ? 0.5 * dosingWeight : 0;
  }

  calculateAminoven(dosingWeight: number, proteinReq: number): number {
    return 10 * dosingWeight * proteinReq;
  }

  calculateNaCl(
    dosingWeight: number,
    naReq: number,
    sodiumSource: string,
    naInIvm: number
  ): number {
    const adjustedNa = naReq - naInIvm;
    return sodiumSource === 'CRL'
      ? (adjustedNa * dosingWeight) / 3
      : adjustedNa * dosingWeight * 2;
  }

  calculateKCl(dosingWeight: number, kReq: number, potPhosK: number): number {
    return (kReq - (4.4 * potPhosK) / dosingWeight) * (dosingWeight / 2);
  }

  calculateCalcium(
    dosingWeight: number,
    caReq: number,
    calciumViaTPN: number
  ): number {
    return calciumViaTPN ? (dosingWeight * caReq) / 9.3 : 0;
  }

  calculateMagnesium(dosingWeight: number, mgReq: number): number {
    return (mgReq * dosingWeight) / 4;
  }
  calculateTotalVolume(
    lipid: number,
    mvi: number,
    celcel: number,
    aminoven: number,
    nacl: number,
    kcl: number,
    calcium: number,
    mgso4: number,
    dextroseVolume: number
  ): number {
    return lipid + mvi + celcel + aminoven + nacl + kcl + calcium + mgso4 + dextroseVolume;
  }
  calculateDextrose(params: {
    F13: number, // 5% D
    F15: number, // 25% D
    L8: number,  // TPN Glucose
    L9: number,  // Dextrose %
  }): { B12: number, B13: number } {
    const { F13, F15, L8, L9 } = params;
  
    // 5% or 25% selected
    if (F13 || F15) {
      const numerator = (5 * L9 * (F15 ? 2.5 : 1)) - (10 * L8);
      const denominator = (5 * (F15 ? 2.5 : 1)) - (F13 ? 0.5 : 0);
      const B12 = denominator !== 0 ? numerator / denominator : 0;
      const B13 = L9 - B12;
      return { B12: Math.max(0, B12), B13: Math.max(0, B13) };
    }
    return { B12: 0, B13: 0 };
  }
  validateIVM(n5: number, n2: number, ns: number, dex10: number, ivm: number): string {
    return n5 + n2 + ns + dex10 > ivm ? 'Wrong IVM volume' : '';
  }

  calculatePotPhos(dosingWeight: number, po4Req: number): number {
    return (po4Req * dosingWeight) / 93;
  }

  calculateOsmolarity(
    lipid: number,
    aminoven: number,
    nacl: number,
    kcl: number,
    calcium: number,
    mgso4: number
  ): number {
    const numerator =
      0.26 * lipid +
      0.885 * aminoven +
      1.027 * nacl +
      4 * kcl +
      0.555 * calcium +
      2.78 * mgso4;

    const denominator = lipid + aminoven + nacl + kcl + calcium + mgso4;

    return denominator > 0 ? (numerator / denominator) * 1000 : 0;
  }

  calculateFluidForGlucose(tfv: number, ...components: number[]): number {
    return tfv - components.reduce((a, b) => a + b, 0);
  }

  calculateTFV(dosingWeight: number, tfr: number): number {
    return dosingWeight * tfr;
  }

  calculateFeeds(dosingWeight: number, feed: number): number {
    return dosingWeight * feed;
  }

  calculateIVFMlKg(tfr: number, feed: number): number {
    return tfr - feed;
  }

  calculateIVFMl(dosingWeight: number, ivfMlKg: number): number {
    return dosingWeight * ivfMlKg;
  }

  calculateTPNFluid(tfv: number, ivm: number): number {
    return tfv - ivm;
  }

  calculateTPNGlucose(gir: number, dosingWeight: number, dex10: number): number {
    return gir * dosingWeight * 1.44 - dex10 * 0.1;
  }

  calculateDextrosePercentage(tpnGlucose: number, totalVolume: number): number {
    return totalVolume > 0 ? (tpnGlucose / totalVolume) * 100 : 0;
  }
  calculateSyringe1Total(lipid: number, mvi: number, celcel: number): number {
    return (lipid + mvi + celcel) / 24; // Match Excel's division by 24
  }

  calculateCNR(gir: number, lipid: number, protein: number): number {
    return protein > 0 ? (6.25 * (4.9 * gir + 9 * lipid)) / protein : 0;
  }

  calculateCaloriesToday(
    protein: number,
    lipid: number,
    gir: number,
    feed: number,
    feedType: string,
    preNanStrength: string
  ): number {
    let feedCalories = 0;
    if (feedType === 'EBM/PDHM') {
      feedCalories = feed * 0.52;
    } else if (feedType === 'Formula') {
      feedCalories = feed * 0.78;
    }

    let preNanCalories = 0;
    switch (preNanStrength) {
      case 'Quarter':
        preNanCalories = feed * 0.04;
        break;
      case 'Half':
        preNanCalories = feed * 0.08;
        break;
      case 'Full':
        preNanCalories = feed * 0.16;
        break;
    }

    return protein * 4 + lipid * 9 + gir * 5 + feedCalories + preNanCalories;
  }

  calculateProteinsToday(
    protein: number,
    feed: number,
    feedType: string,
    preNanStrength: string
  ): number {
    let feedProteins = 0;
    if (feedType === 'EBM/PDHM') {
      feedProteins = feed * 0.0095;
    } else if (feedType === 'Formula') {
      feedProteins = feed * 0.019;
    }

    let preNanProteins = 0;
    switch (preNanStrength) {
      case 'Quarter':
        preNanProteins = feed * 0.003;
        break;
      case 'Half':
        preNanProteins = feed * 0.006;
        break;
      case 'Full':
        preNanProteins = feed * 0.012;
        break;
    }

    return protein + feedProteins + preNanProteins;
  }

  calculateNaInIvm(n5: number, n2: number, ns: number, dosingWeight: number): number {
    return (n5 * 0.031 + n2 * 0.077 + ns * 0.154) / (dosingWeight || 1);
  }

  calculateGlucoseInIvm(dex10: number): number {
    return dex10 * 0.1;
  }

  calculateKInPotphos(potPhos: number, dosingWeight: number): number {
    return dosingWeight === 0 ? 0 : (4.4 * potPhos) / dosingWeight;
  }
}

