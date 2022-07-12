import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {BaseClass} from "../base-class";
import {PersistenceService} from "../../services/persistence/persistence.service";

declare var noUiSlider: any;

@Component({
  selector: 'app-boosted-omm-slider',
  templateUrl: './boosted-omm-slider.component.html'
})
export class BoostedOmmSliderComponent extends BaseClass implements OnInit, OnDestroy {

  private lockOmmSlider!: any; @ViewChild("lckSlider")set d(sliderStake: ElementRef) {this.lockOmmSlider = sliderStake.nativeElement; }

  @Input() lockAdjustActive!: boolean;
  @Input() shouldHideBoostedSlider!: boolean;

  userLockedOmmBalance = 0;

  @Output() sliderValueUpdate = new EventEmitter<number>();

  sliderInitialised = false;

  constructor(public persistenceService: PersistenceService) {
    super(persistenceService);
  }

  ngOnInit(): void {
    this.sliderInitialised = false;
  }

  ngOnDestroy(): void {
    this.lockOmmSlider?.noUiSlider?.destroy();
    this.sliderInitialised = false;
  }

  public createAndInitSlider(startingValue: number, minValue: number, max: number): void {
    this.userLockedOmmBalance = minValue;

    noUiSlider.create(this.lockOmmSlider, {
      start: startingValue,
      padding: 0,
      connect: 'lower',
      range: {
        min: [0],
        max: [max === 0 ? 1 : max]
      },
      step: 1,
    });

    this.initSliderUpdateHandler();
    this.sliderInitialised = true;
  }

  private initSliderUpdateHandler(): void {
    // On stake slider update
    this.lockOmmSlider.noUiSlider.on('update', (values: any, handle: any) => {
      const value = +values[handle];

      // forbid slider value going below users locked Omm balance
      if (value < this.userLockedOmmBalance) {
        this.setSliderValue(this.userLockedOmmBalance);
        return;
      }

      this.sliderValueUpdate.emit(value);
    });
  }

  public updateSliderValues(sliderMax: number, startingValue: number): void {
    if (this.sliderInitialised) {

      this.userLockedOmmBalance = this.persistenceService.getUsersLockedOmmBalance().toNumber();

      this.lockOmmSlider.noUiSlider?.updateOptions({
        start: [startingValue],
        range: { min: 0, max: sliderMax > 0 ? sliderMax : 1 }
      });
    }
  }

  getSliderMax(): number {
    return this.sliderInitialised ? this.lockOmmSlider.noUiSlider?.options.range.max : 1;
  }

  public setSliderValue(value: number): void {
    if (this.sliderInitialised) {
      this.lockOmmSlider.noUiSlider.set(value);
    }
  }

  public enableSlider(): void {
    this.lockOmmSlider.removeAttribute("disabled");
  }

  public disableSlider(): void {
    this.lockOmmSlider.setAttribute("disabled", "");
  }

}
