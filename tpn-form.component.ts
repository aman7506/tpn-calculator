import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TpnCalculationService } from '../services/tpn-calculation.service';

@Component({
  selector: 'app-tpn-form',
  templateUrl: './tpn-form.component.html',
  styleUrls: ['./tpn-form.component.css']
})
export class TpnFormComponent implements OnInit {
  nutritionTfr = new FormControl(0);
  tpnForm!: FormGroup;
  savedData: any;
  percentLabel: string = '10%';
  percentLabel2: string = '50%';
  isCalculating: boolean = false;

  constructor(
    private fb: FormBuilder,
    private tpnService: TpnCalculationService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupFormListeners();
    this.setupDextroseValidation();
    this.updateNutritionTfr();
  }

  private initializeForm(): void {
    this.tpnForm = this.fb.group({
      // Baby Details
      uhid: [''],
      babyName: [''],
      dob: [''],
      birthTime: [''],
      age: [{ value: '', disabled: true }],
      gender: ['male'],

      // Syringe 1
      lipid: [0],
      mvi: [0],
      celcel: [{ value: 0, disabled: true }],
      syringe1Ml: [0],
      // Syringe 2
      aminovenPer: [0],
      aminoven50ml: [0],
      naclPer: [0],
      nacl50ml: [0],
      kclPer: [0],
      kcl50ml: [0],
      calciumPer: [0],
      calcium50ml: [0],
      mgso4Per: [0],
      mgso450ml: [0],
      dextrose5Per: [0],
      dextrose550ml: [0],
      dextrose10Per: [0],
      dextrose1050ml: [0],
      dextrose25Per: [0],
      dextrose2550ml: [0],
      dextrose50Per: [0],
      dextrose5050ml: [0],

      // Totals
      totalVolume: [0],
      totalPer50: [0],
      potPhos: [0],
      calcium10: [0],

      // Dosing & Fluid Details
      dosingWeight: [0],
      tfr: [100],
      feed: [0],
      ivm: [0],
      a: [0],
      l: [0],
      g: [0],
      na: [0],
      k: [0],
      ca: [0],
      mg: [0],
      dextrose5: [0, [Validators.min(0), Validators.max(1)]],
      dextrose10: [1, [Validators.min(0), Validators.max(1)]],
      dextrose25: [0],
      dextrose50: [1],

      // IVM Volume Details
      n5: [0],
      n2: [0],
      ns: [0],
      dex10: [0],
      typeOfOralFeed: ['EBM/PDHM'],
      preNanStrength: ['None'],
      po4: [1],
      calciumViaTPN: [0],
      overfillFactor: [1],
      sodiumSource: ['3% NaCl'],
  

      // Nutritional Requirements
      tfv: [{ value: 0, disabled: true }],
      feeds: [{ value: 0, disabled: true }],
      ivfMlKg: [{ value: 0, disabled: true }],
      ivfMl: [{ value: 0, disabled: true }],
      tpnFluid: [{ value: 0, disabled: true }],
      tpnGlucose: [{ value: 0, disabled: true }],
      fluidForGlucose: [{ value: 0, disabled: true }],
      osmolarity: [{ value: 0, disabled: true }],
      dextrosePercentage: [{ value: 0, disabled: true }],
      cnr: [{ value: 0, disabled: true }],
      caloriesToday: [{ value: 0, disabled: true }],
      proteinsToday: [{ value: 0, disabled: true }],
      naInIvm: [{ value: 0, disabled: true }],
      glucoseInIvm: [{ value: 0, disabled: true }],
      kInPotphos: [{ value: 0, disabled: true }]
    });
  }

  private setupFormListeners(): void {
    this.tpnForm.get('tfr')?.valueChanges.subscribe(() => {
      this.updateNutritionTfr();
    });

    const dobControl = this.tpnForm.get('dob');
    const birthTimeControl = this.tpnForm.get('birthTime');
    
    if (dobControl) {
      dobControl.valueChanges.subscribe(() => this.updateAge());
    }
    
    if (birthTimeControl) {
      birthTimeControl.valueChanges.subscribe(() => this.updateAge());
    }
  
    this.tpnForm.valueChanges.subscribe((values) => {
      this.updateCalculations(values);
    });
  }
  private updateAge(): void {
    const dob = this.tpnForm.get('dob')?.value;
    const birthTime = this.tpnForm.get('birthTime')?.value;
    
    if (dob && birthTime) {
      const age = this.calculateExactAge(dob, birthTime);
      this.tpnForm.get('age')?.patchValue(age);
    }
  }
  private updateNutritionTfr(): void {
    const tfrValue = this.tpnForm.get('tfr')?.value;
    this.nutritionTfr.setValue(tfrValue, { emitEvent: false });
    
    const dosingWeight = this.tpnForm.get('dosingWeight')?.value || 0;
    this.tpnForm.patchValue({
      tfv: dosingWeight * tfrValue
    }, { emitEvent: false });
  }

  private setupDextroseValidation(): void {
    const dextroseControls = [
      this.tpnForm.get('dextrose5'),
      this.tpnForm.get('dextrose10'),
      this.tpnForm.get('dextrose25'),
      this.tpnForm.get('dextrose50')
    ];

    dextroseControls.forEach(control => {
      control?.valueChanges.subscribe(value => {
        if (value === 1) {
          dextroseControls.forEach(c => {
            if (c !== control) c?.setValue(0, { emitEvent: false });
          });
        }
      });
    });

    if (dextroseControls.every(c => c?.value === 0)) {
      this.tpnForm.get('dextrose10')?.setValue(1);
    }
  }

  calculateExactAge(dob: string, birthTime: string): string {
    if (!dob || !birthTime) return '';
    
    try {
      const birthDate = new Date(`${dob}T${birthTime}`);
      const now = new Date();
      
      if (birthDate > now) return 'Invalid date';
  
      const diff = now.getTime() - birthDate.getTime();
      const minutes = Math.floor(diff / 60000);
      
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      const remainingMinutes = minutes % 60;
  
      return `${days}d ${hours}h ${remainingMinutes}m`;
    } catch (e) {
      return 'Invalid date';
    }
  }
  updateCalculations(values: any): void {
    this.isCalculating = true;
    
    try {
      const dosingWeight = values.dosingWeight || 0;
      const tfr = values.tfr || 0;
      const feed = values.feed || 0;
      const ivm = values.ivm || 0;

      // Calculate base components
      const lipid = this.tpnService.calculateLipid(dosingWeight, values.l);
      const mvi = this.tpnService.calculateMVI(dosingWeight, values.l);
      const celcel = this.tpnService.calculateCelcel(dosingWeight, values.celcel);
      const syringe1Total = this.tpnService.calculateSyringe1Total(lipid, mvi, celcel);
this.tpnForm.patchValue({
  syringe1Ml: syringe1Total.toFixed(2),
});
      const aminoven = this.tpnService.calculateAminoven(dosingWeight, values.a);
      const naInIvm = this.tpnService.calculateNaInIvm(values.n5, values.n2, values.ns, dosingWeight);
      const nacl = this.tpnService.calculateNaCl(dosingWeight, values.na, values.sodiumSource, naInIvm);
      const kcl = this.tpnService.calculateKCl(dosingWeight, values.k, values.potPhos);
      const calcium = this.tpnService.calculateCalcium(dosingWeight, values.ca, values.calciumViaTPN);
      const mgso4 = this.tpnService.calculateMagnesium(dosingWeight, values.mg);

      // Calculate dextrose values
      const dextroseParams = {
        F13: values.dextrose5,
        F14: values.dextrose10,
        F15: values.dextrose25,
        F16: values.dextrose50,
        L8: this.tpnForm.get('tpnGlucose')?.value || 0,
        L9: this.tpnForm.get('dextrosePercentage')?.value || 0
      };
      
      const { B12, B13 } = this.tpnService.calculateDextrose(dextroseParams);
      let dextroseVolume = 0;
      
      if (values.dextrose5 || values.dextrose10) {
        dextroseVolume = B12;
      } else if (values.dextrose25 || values.dextrose50) {
        dextroseVolume = B13;
      }

      // Calculate total volume
      const totalVolume = this.tpnService.calculateTotalVolume(
        lipid,
        mvi,
        celcel,
        aminoven,
        nacl,
        kcl,
        calcium,
        mgso4,
        dextroseVolume
      );

      // Calculate derived values
      const tfv = this.tpnService.calculateTFV(dosingWeight, tfr);
      const fluidForGlucose = this.tpnService.calculateFluidForGlucose(
        tfv, 
        lipid, 
        mvi, 
        celcel, 
        aminoven, 
        nacl
      );
      // Console log all control values before calculation
console.log('fluidForGlucose:', this.tpnForm.controls['fluidForGlucose'].value);
console.log('dextrose50:', this.tpnForm.controls['dextrose50'].value);
console.log('dextrose25:', this.tpnForm.controls['dextrose25'].value);
console.log('tpnGlucose:', this.tpnForm.controls['tpnGlucose'].value);
console.log('glucoseInIvm:', this.tpnForm.controls['glucoseInIvm'].value);
console.log('naInIvm:', this.tpnForm.controls['naInIvm'].value);
console.log('dextrose5:', this.tpnForm.controls['dextrose5'].value);
console.log('dextrose10:', this.tpnForm.controls['dextrose10'].value);

let calculatedDextrose = (
  (
    (
      parseFloat(this.tpnForm.controls['fluidForGlucose'].value) * 5 * 
      parseFloat(this.tpnForm.controls['dextrose50'].value)
    ) +
    (
      2.5 * 
      parseFloat(this.tpnForm.controls['fluidForGlucose'].value) * 
      parseFloat(this.tpnForm.controls['dextrose25'].value)
    ) -
    (
      10 * 
      parseFloat(this.tpnForm.controls['tpnGlucose'].value)
    )
  ) / 
  (
    (
      5 * 
      parseFloat(this.tpnForm.controls['glucoseInIvm'].value)
    ) + 
    (
      5 * 
      parseFloat(this.tpnForm.controls['naInIvm'].value)
    )
  )
) + 
(
  2.5 * 
  parseFloat(this.tpnForm.controls['dextrose25'].value)
) - 
(
  0.5 * 
  parseFloat(this.tpnForm.controls['dextrose5'].value)
) + 
parseFloat(this.tpnForm.controls['dextrose10'].value);

console.log('calculatedDextrose:', calculatedDextrose); 
      // Update form values
      this.tpnForm.patchValue({
        // Syringe 1
        lipid: lipid.toFixed(2),
        mvi: mvi.toFixed(2),
        celcel: celcel.toFixed(2),
        syringe1Ml: syringe1Total.toFixed(2),

        // Syringe 2 components
        aminovenPer: aminoven.toFixed(2),
        aminoven50ml: (aminoven / 50).toFixed(2),
        naclPer: nacl.toFixed(2),
        nacl50ml: (nacl / 50).toFixed(2),
        kclPer: kcl.toFixed(2),
        kcl50ml: (kcl / 50).toFixed(2),
        calciumPer: calcium.toFixed(2),
        calcium50ml: (calcium / 50).toFixed(2),
        mgso4Per: mgso4.toFixed(2),
        mgso450ml: (mgso4 / 50).toFixed(2),
        
        // Dextrose values
        dextrose5Per: values.dextrose5 ? dextroseVolume.toFixed(2) : 0,
        dextrose550ml: values.dextrose5 ? (dextroseVolume / 50).toFixed(2) : 0,
        dextrose10Per: values.dextrose10 ? dextroseVolume.toFixed(2) : 0,
        dextrose1050ml: values.dextrose10 ? (dextroseVolume / 50).toFixed(2) : 0,
        dextrose25Per: values.dextrose25 ? dextroseVolume.toFixed(2) : 0,
        dextrose2550ml: values.dextrose25 ? (dextroseVolume / 50).toFixed(2) : 0,
        dextrose50Per: values.dextrose50 ? dextroseVolume.toFixed(2) : 0,
        dextrose5050ml: values.dextrose50 ? (dextroseVolume / 50).toFixed(2) : 0,

        // Totals
        totalVolume: totalVolume.toFixed(2),
        totalPer50: (totalVolume / 24).toFixed(2),

        // Other calculations
        potPhos: this.tpnService.calculatePotPhos(dosingWeight, values.po4).toFixed(2),
        calcium10: values.calciumViaTPN ? ((dosingWeight * values.ca) / 9.3).toFixed(2) : 0,
        tfv: tfv.toFixed(2),
        feeds: this.tpnService.calculateFeeds(dosingWeight, feed).toFixed(2),
        ivfMlKg: this.tpnService.calculateIVFMlKg(tfr, feed).toFixed(2),
        ivfMl: this.tpnService.calculateIVFMl(dosingWeight, tfr - feed).toFixed(2),
        tpnFluid: this.tpnService.calculateTPNFluid(tfv, ivm).toFixed(2),
        tpnGlucose: this.tpnService.calculateTPNGlucose(values.g, dosingWeight, values.dex10).toFixed(2),
        fluidForGlucose: fluidForGlucose.toFixed(2),
        osmolarity: this.tpnService.calculateOsmolarity(
          lipid, 
          aminoven, 
          nacl, 
          kcl, 
          calcium, 
          mgso4
        ).toFixed(2),
        dextrosePercentage: totalVolume > 0 
          ? ((this.tpnForm.value.tpnGlucose / totalVolume) * 100).toFixed(2)
          : 0,
        cnr: this.tpnService.calculateCNR(values.g, values.l, values.a).toFixed(2),
        caloriesToday: this.tpnService.calculateCaloriesToday(
          values.a, values.l, values.g, 
          values.feed, values.typeOfOralFeed, 
          values.preNanStrength
        ).toFixed(2),
        proteinsToday: this.tpnService.calculateProteinsToday(
          values.a, values.feed, 
          values.typeOfOralFeed, values.preNanStrength
        ).toFixed(2),
        naInIvm: naInIvm.toFixed(2),
        glucoseInIvm: this.tpnService.calculateGlucoseInIvm(values.dex10).toFixed(2),
        kInPotphos: this.tpnService.calculateKInPotphos(values.potPhos, dosingWeight).toFixed(2)
      }, { emitEvent: false });

    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      this.isCalculating = false;
    }
  }

  onSubmit(): void {
    this.savedData = this.tpnForm.getRawValue();
  }

  clearData(): void {
    this.tpnForm.reset({
      dextrose10: 1,
      typeOfOralFeed: 'EBM/PDHM',
      preNanStrength: 'None',
      sodiumSource: '3% NaCl',
      overfillFactor: 1
    });
  }

  togglequantity(): void {
    const dextrose5Val = this.tpnForm.controls['dextrose5'].value;
    if (dextrose5Val == 1) {
      this.tpnForm.controls['dextrose10'].setValue(0);
      this.percentLabel = '5%';
    } else {
      this.tpnForm.controls['dextrose10'].setValue(1);
      this.percentLabel = '10%';
    }
  }

  togglequantity2(): void {
    const dextrose25Val = this.tpnForm.controls['dextrose25'].value;
    if (dextrose25Val == 1) {
      this.tpnForm.controls['dextrose50'].setValue(0);
      this.percentLabel2 = '25%';
    } else {
      this.tpnForm.controls['dextrose50'].setValue(1);
      this.percentLabel2 = '50%';
    }
  }
}