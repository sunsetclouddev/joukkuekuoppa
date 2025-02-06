<script setup lang='ts'>

import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import draggable from 'vuedraggable';

import ModalComponent from './ModalComponent.vue'

import { Card, RoundPhase, MatchPhase, GameState, Rules } from '../../../common';

import { DragStart, DragEnd } from './utils/FlipTechnique';

import * as Misc from './utils/Misc';

import { ServerCalls } from './utils/ServerCalls';

const route = useRoute();
const playerID = Number(route.params.id);

const gameStateRef = ref(new GameState());
const aboutToPlayRef = ref([]);

// indirection to prevent automatic unwrapping in vue template
const refs = { gameState: gameStateRef, aboutToPlay: aboutToPlayRef };

const serverCalls = new ServerCalls();
serverCalls.InitializeForGameState(gameStateRef, aboutToPlayRef, playerID);

const ScoreboardIsModalOpened = ref(false);
const ScoreboardOpenModal = () => { ScoreboardIsModalOpened.value = true; };
const ScoreboardCloseModal = () => { ScoreboardIsModalOpened.value = false; };

const InfoIsModalOpened = ref(false);
const InfoOpenModal = () => { InfoIsModalOpened.value = true; };
const InfoCloseModal = () => { InfoIsModalOpened.value = false; };

const WildCardSelectionIsModalOpened = ref(false);
const WildCardSelectionCardContext = ref(null);

const WildCardSelectionOpenModal = (card: Card) =>
{
  WildCardSelectionCardContext.value = card;
  WildCardSelectionIsModalOpened.value = true;
};

const WildCardSelectionCloseModal = () =>
{
  WildCardSelectionCardContext.value = null;
  WildCardSelectionIsModalOpened.value = false;
};

function SelectWildCardValue(card: Card)
{
  WildCardSelectionCardContext.value.SetWildCardSelection(card);
  WildCardSelectionCloseModal();
}

// @todo: could use WebSocket instead of setInterval

let fetchGameStateIntervalID = -1;

onMounted(async () =>
{
  await serverCalls.FetchGameState();
  fetchGameStateIntervalID = setInterval(() => { serverCalls.FetchGameState(); }, 1000);
});

onUnmounted(async () =>
{
  clearInterval(fetchGameStateIntervalID);
});

const allNonWildCards = Misc.CreateAllNonWildCards();

</script>

<!-- @todo: consider splitting template contents into multiple components for clarity -->

<template>

  <ModalComponent :isOpen='ScoreboardIsModalOpened' @modal-close='ScoreboardCloseModal' name='scoreboard modal screen'>
    <template #content>
      <table class='scoreboard'>
        <tbody>
          <tr>
            <th v-for='(n, index) in [ 0, 2, 4 ]'>player {{ n }}</th>
            <th>team 1</th>
            <th>team 2</th>
            <th v-for='(n, index) in [ 1, 3, 5 ]'>player {{ n }}</th>
          </tr>
          <tr v-for='placement in gameStateRef.placements'>
            <td v-for='(n, index) in [ 0, 2, 4 ]'>{{ Misc.ShowPlacementScore(placement[n]) }}</td>
            <td class='withborder'>{{ Rules.CalculateRoundScore([ placement[0], placement[2], placement[4] ]) }}</td>
            <td class='withborder'>{{ Rules.CalculateRoundScore([ placement[1], placement[3], placement[5] ]) }}</td>
            <td v-for='(n, index) in [ 1, 3, 5 ]'>{{ Misc.ShowPlacementScore(placement[n]) }}</td>
          </tr>
          <tr>
            <td v-for='(n, index) in 3'></td>
            <td class='withborder'><b>{{ Rules.CalculateTotalScore(gameStateRef.placements, [ 0, 2, 4 ]) }}</b></td>
            <td class='withborder'><b>{{ Rules.CalculateTotalScore(gameStateRef.placements, [ 1, 3, 5 ]) }}</b></td>
            <td v-for='(n, index) in 3'></td>
          </tr>
        </tbody>
      </table>
      <br />
      <p v-if='gameStateRef.matchPhase === MatchPhase.Completed'>
        Match is completed! Team {{ gameStateRef.matchWinner }} wins!
      </p>
    </template>
  </ModalComponent>

  <ModalComponent :isOpen='InfoIsModalOpened' @modal-close='InfoCloseModal' name='info modal screen'>
    <template #content>
      <p>This is an online multiplayer implementation of the following card game:</p>
      <br>
      <ul class='infolist'>
        <li>Base game category: <b>Zheng Shangyou</b></li>
        <li>Variant: 3vs3 team variant known as <b>Sān jiā xĭ</b> or <b>Huŏjiàn</b></li>
        <li>Western variant: known as <b>Pits</b></li>
        <li>Finnish variant: known as <b>Kuoppa</b> or <b>Joukkuekuoppa</b></li>
        <li><a href='https://www.pagat.com/climbing/shangyou.html' target='_blank'>Rules and Other Background Information</a></li>
      </ul>
    </template>
  </ModalComponent>

  <ModalComponent :isOpen='WildCardSelectionIsModalOpened' @modal-close='WildCardSelectionCloseModal' name='wild card selection screen'>
    <template #content>
      <p>Select actual card for the wild card:</p>
      <br />
      <div v-for='(n, wildcardindex) in 4'>
        <ul class='cards wildcardselection'>
          <li class='cards wildcardselection' v-for='card in allNonWildCards[wildcardindex]'>
            <div class='card wildcardselection' @click='SelectWildCardValue(card)'> <div class='face' :style='Misc.GetCardStyle(card)' /> </div>
          </li>
        </ul>
      </div>
    </template>
  </ModalComponent>

  <div class='content'>

    <div class='logo'>joukkuekuoppa</div>

    <div class='overlay'>
      <div class='scoreboardbutton'> <button class='scoreboard effects v2' @click='ScoreboardOpenModal'>scoreboard</button> </div>
      <div class='infobutton'> <button class='info effects v3' @click='InfoOpenModal'>info</button> </div>
    </div>

    <div class='otherportion'>

      <div class='allotherhands'>
        <div v-if='gameStateRef.players.length >= 6' v-for='index in 5'>
          <div class='otherhandsstatus' :class='"h" + index'> {{ Misc.ShowStatusAsString(refs.gameState, gameStateRef.players[index].id, index) }} </div>
          <ul class='cards otherhands' :class='"h" + index, { turnhighlight: Misc.IsTurn(refs.gameState, gameStateRef.players[index].id) }'>
            <li v-for='(card, i) in gameStateRef.players[index].hand' class='cards otherhands flipElement'
              :flipID='String(card.identifier)' :style='Misc.GetCardRotation(i, gameStateRef.players[index].hand.length)'>
              <div class='card otherhands'> <div class='face' :style='Misc.GetCardStyle(card)' /> </div>
            </li>
          </ul>
        </div>
      </div>

      <div class='cards playedcards'>
        <ul class='cards playedcards' v-for='(cards, i) in gameStateRef.playedCards'>
          <li v-for='card in cards' class='cards playedcards flipElement' :flipID='String(card.identifier)'>
            <div class='card playedcards'> <div class='face' :style='Misc.GetCardStyle(card)' /> </div>
            <div class='card selectedwildcard' v-if='Misc.UseWildCardSelection(card, cards, refs.aboutToPlay)'>
              <div class='face' :style='Misc.GetWildCardStyle(card, allNonWildCards)' />
            </div>
          </li>
        </ul>
      </div>

      <div class='usermessage'>
        <div v-if='gameStateRef.roundPhase === RoundPhase.HandoverPhase1Give'>
          <div v-if='Misc.IsHandoverGiveActionNeeded(refs.gameState, playerID)'>
            Handover in progress. <br />
            Give your best card.
          </div>
          <div v-else>
            Handover in progress. <br />
            Waiting for cards from <br />
            the 5th and 6th positions.
          </div>
        </div>
        <div v-if='gameStateRef.roundPhase === RoundPhase.HandoverPhase2Give'>
          <div v-if='Misc.IsHandoverGiveActionNeeded(refs.gameState, playerID)'>
            Handover in progress. <br />
            Give any one card.
          </div>
          <div v-else>
            Handover in progress. <br />
            Waiting for cards from <br />
            the 1st and 2nd positions.
          </div>
        </div>
        <div v-if='gameStateRef.roundPhase === RoundPhase.HandoverPhase1Receive'>
          <div v-if='Misc.IsHandoverReceiveActionNeeded(refs.gameState, playerID)'>
            Handover in progress. <br />
            Select card.
            <ul>
              <li class='cards handover'>From 5th: <div class='card playedcards' @click='serverCalls.SelectHandoverCard(true)'>
                <div class='face' :style='Misc.GetCardStyle(gameStateRef.handoverCard1)' />
              </div> </li>
              <li class='cards handover'>From 6th: <div class='card playedcards' @click='serverCalls.SelectHandoverCard(false)'>
                <div class='face' :style='Misc.GetCardStyle(gameStateRef.handoverCard2)' />
              </div> </li>
            </ul>
          </div>
          <div v-else>
            Handover in progress. <br />
            Waiting for the 1st <br />
            position to select <br />
            a card from the table.
            <ul>
              <li class='cards handover'>From 5th: <div class='card playedcards'> <div class='face' :style='Misc.GetCardStyle(gameStateRef.handoverCard1)' /> </div> </li>
              <li class='cards handover'>From 6th: <div class='card playedcards'> <div class='face' :style='Misc.GetCardStyle(gameStateRef.handoverCard2)' /> </div> </li>
            </ul>
          </div>
        </div>
        <div v-if='gameStateRef.roundPhase === RoundPhase.HandoverPhase2Receive'>
          <div v-if='Misc.IsHandoverReceiveActionNeeded(refs.gameState, playerID)'>
            Handover in progress. <br />
            Select card.
            <ul>
              <li class='cards handover'>From 1st: <div class='card playedcards' @click='serverCalls.SelectHandoverCard(true)'>
                <div class='face' :style='Misc.GetCardStyle(gameStateRef.handoverCard1)' />
              </div> </li>
              <li class='cards handover'>From 2nd: <div class='card playedcards' @click='serverCalls.SelectHandoverCard(false)'>
                <div class='face' :style='Misc.GetCardStyle(gameStateRef.handoverCard2)' />
              </div> </li>
            </ul>
          </div>
          <div v-else>
            Handover in progress. <br />
            Waiting for the 5th <br />
            position to select <br />
            a card from the table.
            <ul>
              <li class='cards handover'>From 1st: <div class='card playedcards'> <div class='face' :style='Misc.GetCardStyle(gameStateRef.handoverCard1)' /> </div> </li>
              <li class='cards handover'>From 2nd: <div class='card playedcards'> <div class='face' :style='Misc.GetCardStyle(gameStateRef.handoverCard2)' /> </div> </li>
            </ul>
          </div>
        </div>
        <div v-if='gameStateRef.matchPhase === MatchPhase.Completed'>
          Match is completed! Team {{ gameStateRef.matchWinner }} wins!
        </div>
      </div>

    </div>

    <div class='playerportion' :class='{ turnhighlight: Misc.IsTurn(refs.gameState, playerID) }'>

      <div class='playerfirstline'>
        <div class='abouttoplayarea'>
          <!-- <div class='explanation'>drag cards here</div> -->
          <draggable v-model='aboutToPlayRef' item-key='identifier' tag='ul' group='playerhand'
                  :animation='200' class='cards abouttoplay' ghost-class='hidden-ghost' fallback-class='chosen' :force-fallback='true'
                  @start='DragStart($event)' @end='DragEnd($event)'>
            <template #item='{ element: card }'>
              <li class='cards flipElement' :flipID='String(card.identifier)'>
                <div class='card abouttoplay'> <div class='face' :style='Misc.GetCardStyle(card)' /> </div>
                <div class='card selectedwildcard' v-if='Misc.UseWildCardSelection(card, null, refs.aboutToPlay)'>
                  <div class='face' :style='Misc.GetWildCardStyle(card, allNonWildCards)' />
                </div>
                <button class='wildcardquestion' v-if='Misc.UseWildCardSelection(card, null, refs.aboutToPlay)' @click='WildCardSelectionOpenModal(card)'>?</button>
              </li>
            </template>
          </draggable>
        </div>
        <div class='playerbuttons'>
          <div v-if='gameStateRef.players.length >= 6' class='playerstatus'> {{ Misc.ShowStatusAsString(refs.gameState, playerID, 0) }} </div>
          <div v-if='Misc.IsDealerActionNeeded(refs.gameState, playerID)'>
            <div class='playerbutton'><button class='effects v1' @click='serverCalls.DealCards()'>deal</button></div>
          </div>
          <div v-else-if='Misc.IsHandoverGiveActionNeeded(refs.gameState, playerID) || Misc.IsHandoverGiveActionNeeded(refs.gameState, playerID)'>
            <div class='playerbutton'>
              <button class='effects v1'
                @click='serverCalls.HandoverSelectedCard()'
                :disabled='!Misc.IsGiveEnabled(refs.gameState, refs.aboutToPlay)'>give</button>
            </div>
          </div>
          <div v-else>
            <div class='playerbutton'>
              <button class='effects v1'
                @click='serverCalls.PlaySelectedCards()'
                :disabled='!Misc.IsPlayEnabled(refs.gameState, refs.aboutToPlay, playerID)'>play</button>
            </div>
            <div class='playerbutton'>
              <button class='effects v1'
                @click='serverCalls.PassTurn()'
                :disabled='!Misc.IsPassEnabled(refs.gameState, playerID)'>pass</button>
            </div>
          </div>
        </div>
      </div>

      <div class='playersecondline'>
        <draggable v-if='gameStateRef.players.length >= 6' v-model='gameStateRef.players[0].hand' item-key='identifier' tag='ul' group='playerhand'
                :animation='200' class='cards playerhand' ghost-class='hidden-ghost' fallback-class='chosen' :force-fallback='true'
                @start='DragStart($event)' @end='DragEnd($event)'>
          <template #item='{ element: card }'>
            <li class='cards'> <div class='card'> <div class='face' :style='Misc.GetCardStyle(card)' /> </div> </li>
          </template>
        </draggable>
      </div>

      <div class='playerthirdline'>
        <div class='playerinfo'> player {{ playerID }} </div>
      </div>

    </div>

  </div>

</template>

<style scoped>

.content { width: 100vw; height: 100vh; display: flex; flex: 1 1 0; flex-direction: column; }

.logo { position: absolute; margin: 2cqh 4cqw; font-family: "base font"; font-size: min(4cqw, 50px); }

.overlay { position: absolute; }

.scoreboardbutton { position: fixed; right: 60px; margin: 2cqh 20px; }
button.scoreboard { padding: 5px 10px; }

table.scoreboard { border-spacing: 0; }
table.scoreboard > tbody > tr:nth-child(even) { background-color: #e8e8e8; }
table.scoreboard > tbody > tr > th { padding: 4px; color: white; background-color: #123456; }
table.scoreboard > tbody > tr > td { text-align: center; padding: 10px; }
table.scoreboard > tbody > tr > td.withborder { border-left: solid 1px; border-right: solid 1px; }

.infobutton { position: fixed; right: 0; margin: 2cqh 20px; }
button.info { padding: 5px 10px; }

.otherportion
{
  flex: 0.6; display: flex; justify-content: center; overflow: hidden;
  background-image: url('@/assets/gfx/landscape.svg'); background-size: 100% 100%;
}

.allotherhands
{
  display: inline-block; width: auto; height: 100%; aspect-ratio: 1.5/1;
  background-image: url('@/assets/gfx/feltsemicircle.svg'); background-size: 100% 100%;
}

.playerportion
{
  flex: 0.4; overflow: hidden; display: flex; flex-direction: column;
  background-image: url('@/assets/gfx/felt.svg');
}

.turnhighlight { box-shadow: 0 0 20px 5px rgba(0, 200, 200, 1.0); }
.playerportion.turnhighlight { box-shadow: inset 0 0 15px 2px rgba(0, 200, 200, 1.0); }

.playerfirstline { flex: 0.4; overflow: hidden; display: flex; justify-content: center; align-items: center; }
.playersecondline { flex: 0.45; overflow: hidden; display: flex; justify-content: center; align-items: center; }
.playerthirdline { flex: 0.15; overflow: hidden; display: flex; justify-content: center; align-items: center; }

.abouttoplayarea { flex: 0.8; overflow: hidden; text-align: center; position: relative; height: 80%; }

.explanation
{
  position: absolute; display: inline-block; width: 95%; height: 95%;
  border-style: dotted; padding: 0px 0px; color: #222222; z-index: -1;
}

.wildcardquestion { width: auto; height: 35%; max-height: 100%; aspect-ratio: 3/4; position: absolute; top: 35%; padding: 0.1cqh 0.5cqw; }

.playerbuttons { flex: 0.2; }
.playerbutton { display: inline-block; }

button.effects { font-family: "base font"; margin: 5px; border: none; color: white; box-shadow: 0 0px 20px 0 rgba(0, 0, 0, 0.5); }
button.effects:disabled { opacity: 0.3; }
button.effects:hover:enabled { box-shadow: 0 0px 20px 0 rgba(0, 0, 0, 0.9); }

button.effects.v1 { font-size: min(2cqw, 30px); margin: 2cqh 5px; padding: min(1cqw, 10px) min(1.3cqw, 20px); border-radius: 50%; background-color: #00AA00; }
button.effects.v1:active:enabled { background-color: #004400; }

button.effects.v2 { font-size: min(2cqw, 20px); padding: 5px 10px; border-radius: 10%; background-color: #DD9900; }
button.effects.v2:active:enabled { background-color: #AA6600; }

button.effects.v3 { font-size: min(2cqw, 20px); padding: 5px 10px; border-radius: 10%; background-color: #7777FF; }
button.effects.v3:active:enabled { background-color: #4444CC; }

.playerstatus { display: inline-block; }

.playerinfo { display: inline-block; margin: 10px; }

.hidden-ghost { opacity: 10%; }
.hidden-ghost > .selectedwildcard { opacity: 0%; }
.hidden-ghost > .wildcardquestion { opacity: 0%; }

.chosen { filter: drop-shadow(0px 0px 20px black); }

.usermessage { position: fixed; top: 35%; left: 50%; transform: translate(-50%, -50%); font-size: 30px; }

ul.cards { display: inline-block; background-color: #00553D; list-style-type: none; padding: 0; margin: 0; text-align: center; }

ul.cards.playedcards
{
  position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%);
  background-color: transparent; width: auto; height: 11%; aspect-ratio: 8/1;
}

ul.otherhands
{
  position: fixed; top: 42%; left: 50%;
  background-color: transparent; width: auto; height: 7.5%; aspect-ratio: 3/1;
}

ul.otherhands.h1 { transform-origin: center; transform: translate(-50%, 0) rotate(90deg) translate(0, 36cqh); }
ul.otherhands.h2 { transform-origin: center; transform: translate(-50%, 0) rotate(135deg) translate(0, 36cqh); }
ul.otherhands.h3 { transform-origin: center; transform: translate(-50%, 0) rotate(180deg) translate(0, 36cqh); }
ul.otherhands.h4 { transform-origin: center; transform: translate(-50%, 0) rotate(225deg) translate(0, 36cqh); }
ul.otherhands.h5 { transform-origin: center; transform: translate(-50%, 0) rotate(270deg) translate(0, 36cqh); }

.otherhandsstatus { position: fixed; top: 44%; left: 50%; }
.otherhandsstatus.h1 { text-align: center; transform-origin: center; transform: translate(-50%, 0) rotate(-90deg) translate(0, -28cqh); }
.otherhandsstatus.h2 { text-align: center; transform-origin: center; transform: translate(-50%, 0) rotate(-45deg) translate(0, -28cqh); }
.otherhandsstatus.h3 { text-align: center; transform-origin: center; transform: translate(-50%, 0) rotate(0deg) translate(0, -28cqh); }
.otherhandsstatus.h4 { text-align: center; transform-origin: center; transform: translate(-50%, 0) rotate(45deg) translate(0, -28cqh); }
.otherhandsstatus.h5 { text-align: center; transform-origin: center; transform: translate(-50%, 0) rotate(90deg) translate(0, -28cqh); }

ul.abouttoplay { width: auto; height: 100%; max-width: 90%; aspect-ratio: 8/1; }
ul.playerhand { width: auto; height: 100%; max-width: 90%; aspect-ratio: 8/1; }

ul.wildcardselection { width: auto; height: 5rem; max-width: 90%; aspect-ratio: 8/1; }

ul.infolist > li { margin: 2rem; }

li.cards { display: inline-block; width: 9%; height: 100%; }
li.cards:not(:first-child) { margin-left: 1%; }

li.otherhands.otherhands { width: 18%; margin-left: -8%; }
li.wildcardselection.wildcardselection { margin: -1%; }

li.handover { width: 25%; margin: 5%; }

.card { width: 100%; height: auto; max-height: 100%; aspect-ratio: 3/4; }
.card.selectedwildcard { width: auto; height: 50%; max-height: 100%; aspect-ratio: 3/4; position: absolute; top: 22%; padding: 0.5cqh 0.5cqw; }

.card .face { width: 100%; height: 100%; background-size: 100% 100%; }

</style>
