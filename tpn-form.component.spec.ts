import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TpnFormComponent } from './tpn-form.component';

describe('TpnFormComponent', () => {
  let component: TpnFormComponent;
  let fixture: ComponentFixture<TpnFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TpnFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TpnFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
