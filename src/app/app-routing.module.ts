import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from "./components/home/home.component";
import {VoteComponent} from "./components/vote/vote.component";
import {RewardsComponent} from "./components/rewards/rewards.component";
import {AllProposalsComponent} from "./components/all-proposals/all-proposals.component";
import {NewProposalComponent} from "./components/new-proposal/new-proposal.component";
import {ProposalComponent} from "./components/proposal/proposal.component";

const routes: Routes = [
  {
    path: '', pathMatch: 'full', redirectTo: 'home'
  },
  { path: 'home', component: HomeComponent},
  // { path: 'home', component: HomeComponent, data: { reuseRoute: true } },
  { path: 'vote/all-proposals', component: AllProposalsComponent },
  { path: 'vote/new-proposal', component: NewProposalComponent },
  { path: 'vote/proposal/:id', component: ProposalComponent },
  { path: 'vote', component: VoteComponent},
  { path: 'rewards', component: RewardsComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
