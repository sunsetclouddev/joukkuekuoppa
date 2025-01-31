<script setup lang='ts'>

import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router'

import { GameSettings } from '../../../common';

import { ServerCalls } from './utils/ServerCalls';

const gameRunningStatusRef = ref(false);
const gameSettingsRef = ref(new GameSettings());

const serverCalls = new ServerCalls();
serverCalls.InitializeForGameSettings(gameRunningStatusRef, gameSettingsRef);

// @todo: could use WebSocket instead of setInterval

onMounted(async () => { await serverCalls.FetchGameRunningStatus(); setInterval(() => { serverCalls.FetchGameRunningStatus() }, 1000); });
onMounted(async () => { await serverCalls.FetchGameSettings(); setInterval(() => { serverCalls.FetchGameSettings() }, 1000); });

function GetRunningStatus()
{
  return gameRunningStatusRef.value ? 'running' : 'not running';
}

function GetStartOrRestartText()
{
  return gameRunningStatusRef.value ? 'restart game' : 'start game';
}

</script>

<template>

  <div class='content'>

    <div class='titleinfo explanation'>
      joukkuekuoppa lobby
    </div>

    <div class='gamelinks explanation'>
      <div>enter the game as player ... </div>
      <div class='gamelink' v-for='index in 6' :key='index'>
        <RouterLink :to='"game/player" + (index - 1)'><button>player {{index - 1}}</button></RouterLink>
      </div>
    </div>

    <div class='gamecontrols explanation'>

      <div>game controls</div>

      <div class='settingsubgroup'>
        <div>current status: {{ GetRunningStatus() }} </div>
        <div class='controlbutton'><button @click='serverCalls.StartOrRestartGame()'>{{ GetStartOrRestartText() }}</button></div>
        <div class='controlbutton'><button @click='serverCalls.StopGame()'>stop game</button></div>
      </div>

      <div>settings</div>

      <div class='settingsubgroup'>
        <div>use AI</div>
        <div v-for='index in 6' :key='index'>
          <input type='checkbox' v-model='gameSettingsRef.aiPlayers[index - 1]' class='checkboxstyle' @change='serverCalls.SetGameSettings()'>
            player {{index - 1}}
          </input>
        </div>
      </div>

      <div class='settingsubgroup'>
        <input type='checkbox' v-model='gameSettingsRef.openCards' class='checkboxstyle' @change='serverCalls.SetGameSettings()'>
          open cards
        </input>
      </div>

    </div>

  </div>

</template>

<style scoped>

.content { width: 30vw; height: 70vh; padding: 50px 50px; margin: auto; display: flex; flex: 1 1 0; flex-direction: column; }
.titleinfo { flex: 0.05; padding: 20px 20px; margin-bottom: 20px; }
.gamelinks { flex: 0.1; padding: 20px 20px; margin-bottom: 20px; }
.gamelink { display: inline-block; padding: 10px 10px; }
.gamecontrols { flex: 0.3; padding: 20px 20px; }
.settingsubgroup { padding: 10px 10px; }
.controlbutton { display: inline-block; padding: 10px 10px; }
.checkboxstyle { margin-left: 10px; margin-right: 10px }
.explanation { border-style: dotted; color: #222222; }

</style>
