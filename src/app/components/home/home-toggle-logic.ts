import {PersistenceService} from "../../services/persistence/persistence.service";
import {AssetTag} from "../../models/Asset";

declare var $: any;
declare var noUiSlider: any;

/* ==========================================================================
  Toggle logic
========================================================================== */

// On "Market overview" click
export function onToggleMarketOverviewClick(): void {
  $("#toggle-your-overview").removeClass('active');
  $("#toggle-market-overview").addClass('active');
  $("#your-overview-content").hide();
  $("#market-overview-content").show();
}

// On "Your overview" click
export function onToggleYourOverviewClick(): void {
  $("#toggle-your-overview").addClass('active');
  $("#toggle-market-overview").removeClass('active');
  $("#your-overview-content").show();
  $("#market-overview-content").hide();
}

// On "Per day" click
export function onTimeSelectorClick(): void {
  $('#time-selector').toggleClass("active");
  $('#time-tooltip').toggleClass("active");
}

// On Supply / Adjust click
export function onSupplyAdjustClick(bridgeSupplySlider: any, iconSupplySlider: any, tapSupplySlider: any,
                                    bridgeBorrowSlider: any, persistenceService: PersistenceService, iconBorrowSlider: any): void {
  $('.supply').toggleClass("adjust");
  $('.supply-actions').toggleClass("hide");

  // Bridge
  $('#supply-deposited-bridge').prop('disabled', (i: any, v: any) => !v);
  $('#supply-available-bridge').prop('disabled', (i: any, v: any) => !v);
  bridgeSupplySlider.toggleAttribute('disabled');
  bridgeSupplySlider.noUiSlider.set(persistenceService.getUserSuppliedAssetBalance(AssetTag.USDb) ?? 0);

  // ICON
  $('#supply-deposited-icon').prop('disabled', (i: any, v: any) => !v);
  $('#supply-available-icon').prop('disabled', (i: any, v: any) => !v);
  // iconSupplySlider.toggleAttribute('disabled');
  iconSupplySlider.noUiSlider.set(persistenceService.getUserSuppliedAssetBalance(AssetTag.ICX) ?? 0);

  // TAP
  $('#supply-deposited-tap').prop('disabled', (i: any, v: any) => !v);
  $('#supply-available-tap').prop('disabled', (i: any, v: any) => !v);
  tapSupplySlider.toggleAttribute('disabled');
  // tapSupplySlider.noUiSlider.set(10000);

  if ($(".borrow").hasClass("adjust")) {
    $('.borrow').removeClass("adjust");
    $('.borrow-actions').toggleClass("hide");
    $('#borrow-borrowed-bridge').prop('disabled', (i: any, v: any) => !v);
    $('#borrow-available-bridge').prop('disabled', (i: any, v: any) => !v);
    bridgeBorrowSlider.toggleAttribute('disabled');
    bridgeBorrowSlider.noUiSlider.set(persistenceService.getUserBorrowedAssetBalance(AssetTag.USDb) ?? 0);

    // iconBorrowSlider.toggleAttribute('disabled');
    iconBorrowSlider.noUiSlider.set(persistenceService.getUserBorrowedAssetBalance(AssetTag.ICX) ?? 0);
  }
}

export function onBorrowAdjustClick(bridgeBorrowSlider: any, iconSupplySlider: any, tapSupplySlider: any,
                                    bridgeSupplySlider: any, persistenceService: PersistenceService): void {
  $('.borrow').toggleClass("adjust");
  $('.borrow-actions').toggleClass("hide");

  // Bridge
  $('#borrow-borrowed-bridge').prop('disabled', (i: any, v: any) => !v);
  $('#borrow-available-bridge').prop('disabled', (i: any, v: any) => !v);
  bridgeBorrowSlider.toggleAttribute('disabled');
  bridgeBorrowSlider.noUiSlider.set(persistenceService.getUserBorrowedAssetBalance(AssetTag.USDb) ?? 0);

  // ICON
  $('#supply-deposited-icon').prop('disabled', (i: any, v: any) => !v);
  $('#supply-available-icon').prop('disabled', (i: any, v: any) => !v);
  // iconSupplySlider.toggleAttribute('disabled');
  iconSupplySlider.noUiSlider.set(persistenceService.getUserSuppliedAssetBalance(AssetTag.ICX) ?? 0);

  // TAP
  $('#supply-deposited-tap').prop('disabled', (i: any, v: any) => !v);
  $('#supply-available-tap').prop('disabled', (i: any, v: any) => !v);
  tapSupplySlider.toggleAttribute('disabled');
  // tapSupplySlider.noUiSlider.set(10000);

  if ($(".supply").hasClass("adjust")) {
    $('.supply').removeClass("adjust");
    $('.supply-actions').toggleClass("hide");

    $('#supply-deposited-bridge').prop('disabled', (i: any, v: any) => !v);
    $('#supply-available-bridge').prop('disabled', (i: any, v: any) => !v);
    bridgeSupplySlider.toggleAttribute('disabled');
    bridgeSupplySlider.noUiSlider.set(persistenceService.getUserSuppliedAssetBalance(AssetTag.USDb) ?? 0);

    // iconSupplySlider.toggleAttribute('disabled');
    iconSupplySlider.noUiSlider.set(persistenceService.getUserSuppliedAssetBalance(AssetTag.ICX) ?? 0);
  }
}