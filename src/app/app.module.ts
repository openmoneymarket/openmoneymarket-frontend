import { BrowserModule } from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {FormsModule} from '@angular/forms';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import {CoreModule} from "./core/core.module";
import { NotificationComponent } from './components/notification/notification.component';
import { ModalComponent } from './components/modal/modal.component';
import { PerformanceComponent } from './components/performance/performance.component';
import { RiskComponent } from './components/risk/risk.component';
import { AssetComponent } from './components/asset/asset.component';
import {environment} from "../environments/environment";
import log from "loglevel";
import { VoteComponent } from './components/vote/vote.component';
import { MainComponent } from './components/main/main.component';
import {HttpClientModule} from "@angular/common/http";
import { RewardsComponent } from './components/rewards/rewards.component';
import { UsFormatPipe } from './pipes/us-format.pipe';
import { RoundOff2DecPipe } from './pipes/round-off-2-dec.pipe';
import { RoundDown2DecPipe } from './pipes/round-down-2-dec.pipe';
import { PoolStakeSliderComponent } from './components/pool-stake-slider/pool-stake-slider.component';
import BigNumber from "bignumber.js";
import {RoundOff0DecPipe} from "./pipes/round-off-0-dec.pipe";
import { AllProposalsComponent } from './components/all-proposals/all-proposals.component';
import { NewProposalComponent } from './components/new-proposal/new-proposal.component';
import { ProposalComponent } from './components/proposal/proposal.component';
import { BannerComponent } from './components/banner/banner.component';
import { LoadingComponent } from './components/loading/loading.component';
import { ToZeroIfDashPipe } from './pipes/to-zero-if-dash.pipe';
import { AngularResizedEventModule } from 'angular-resize-event';
import { BoostedOmmSliderComponent } from './components/boosted-omm-slider/boosted-omm-slider.component';
import { OmmLockingComponent } from './components/omm-locking/omm-locking.component';
import {DollarUsLocalePipe} from "./pipes/dollar-us-locale.pipe";
import {RoundOff2DecPercentPipe} from "./pipes/round-off-2-dec-percent.pipe";
import { YourOverviewComponent } from './components/your-overview/your-overview.component';
import { MarketOverviewComponent } from './components/market-overview/market-overview.component';
import {AbsPipe} from "./pipes/abs-pipe";
import { LatestProposalsComponent } from './components/latest-proposals/latest-proposals.component';
import {RoundDown0DecPercentPipe} from "./pipes/round-down-0-dec-percent.pipe";
import { AllPoolsComponent } from './components/all-pools/all-pools.component';
import { YourPoolsComponent } from './components/your-pools/your-pools.component';
import { AllPoolRowComponent } from './components/all-pools/all-pool-row/all-pool-row.component';
import { YourPoolRowComponent } from './components/your-pools/your-pool-row/your-pool-row.component';
import { YourAvailPoolRowComponent } from './components/your-pools/your-avail-pool-row/your-avail-pool-row.component';
import {RouteReuseStrategy} from "@angular/router";
import {CustomReuseStrategy} from "./routing";
import {DeviceDetectorService} from "ngx-device-detector";

// Big Number configs
const fmt = {
  prefix: '',
  decimalSeparator: '.',
  groupSeparator: ',',
  groupSize: 3,
  secondaryGroupSize: 0,
  fractionGroupSeparator: ' ',
  fractionGroupSize: 0,
  suffix: '',
};

BigNumber.config({ FORMAT: fmt, ROUNDING_MODE: BigNumber.ROUND_DOWN, DECIMAL_PLACES: 18 });
BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_DOWN }); // equivalent

// set logging level
log.setLevel(environment.production ? "error" : "debug");

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomeComponent,
    NotificationComponent,
    ModalComponent,
    PerformanceComponent,
    RiskComponent,
    AssetComponent,
    VoteComponent,
    MainComponent,
    RewardsComponent,
    UsFormatPipe,
    RoundDown0DecPercentPipe,
    AbsPipe,
    DollarUsLocalePipe,
    RoundOff2DecPercentPipe,
    RoundOff2DecPipe,
    RoundDown2DecPipe,
    RoundOff0DecPipe,
    PoolStakeSliderComponent,
    AllProposalsComponent,
    NewProposalComponent,
    ProposalComponent,
    BannerComponent,
    LoadingComponent,
    ToZeroIfDashPipe,
    BoostedOmmSliderComponent,
    OmmLockingComponent,
    YourOverviewComponent,
    MarketOverviewComponent,
    LatestProposalsComponent,
    AllPoolsComponent,
    YourPoolsComponent,
    AllPoolRowComponent,
    YourPoolRowComponent,
    YourAvailPoolRowComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    CoreModule,
    HttpClientModule,
    AngularResizedEventModule
  ],
  providers: [
    DeviceDetectorService,
    HttpClientModule,
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
