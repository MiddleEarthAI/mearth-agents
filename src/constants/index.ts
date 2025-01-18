import { TerrainType } from "../types";

export const BATTLE_RANGE = 2;
export const TOKEN_BURN_MIN = 31;
export const TOKEN_BURN_MAX = 50;
export const DEATH_CHANCE = 0.05;
export const BATTLE_COOLDOWN = 14400; // 4 hours in seconds

export const water = {
  type: TerrainType.RIVER,
  coordinates: new Set([
    "27,7",
    "27,8",
    "27,9",
    "27,10",
    "27,11",
    "27,12",
    "27,13",
    "27,14",
    "27,15",
    "27,16",
    "26,11",
    "26,12",
    "26,13",
    "26,14",
    "26,15",
    "28,13",
    "28,14",
    "28,16",
    "29,14",
    "29,15",
    "7,3",
    "8,3",
    "9,3",
    "9,4",
    "10,4",
    "10,5",
    "10,6",
    "10,7",
    "11,7",
    "11,8",
    "11,9",
    "10,9",
    "10,10",
    "10,11",
    "9,11",
    "9,12",
    "9,13",
    "8,13",
    "3,20",
    "3,19",
    "3,18",
    "4,23",
    "4,22",
    "4,21",
    "4,20",
    "4,19",
    "4,18",
    "4,17",
    "4,16",
    "5,22",
    "6,22",
    "5,21",
    "7,21",
    "5,20",
    "6,20",
    "7,20",
    "5,16",
    "5,15",
    "6,15",
    "6,14",
    "7,15",
    "7,14",
    "8,15",
    "9,15",
    "9,16",
    "10,16",
    "10,17",
    "10,18",
    "10,19",
    "10,20",
    "11,17",
    "11,18",
    "12,18",
    "12,19",
    "13,18",
    "13,19",
    "13,20",
    "14,19",
    "14,20",
    "14,21",
    "15,21",
    "16,21",
    "17,21",
    "18,21",
    "18,20",
    "17,20",
    "17,19",
    "16,19",
    "15,19",
    "9,21",
    "9,22",
    "9,23",
    "9,24",
    "9,25",
    "9,26",
    "9,27",
    "10,27",
    "11,27",
    "11,26",
    "11,25",
    "10,25",
    "10,24",
  ]),
};

export const mountains = {
  type: TerrainType.MOUNTAIN,
  coordinates: new Set([
    "6,12",
    "6,13",
    "7,13",
    "12,15",
    "13,15",
    "13,14",
    "13,13",
    "13,12",
    "13,11",
    "13,10",
    "14,11",
    "14,10",
    "15,10",
    "15,9",
    "16,9",
    "16,8",
    "17,8",
    "18,8",
    "19,8",
    "20,8",
    "21,8",
    "22,8",
    "19,9",
    "21,7",
    "22,7",
    "4,24",
    "5,24",
    "5,23",
    "6,23",
    "7,22",
    "8,22",
    "8,21",
    "8,20",
    "9,20",
    "13,23",
    "14,23",
    "14,22",
    "15,22",
    "15,24",
    "15,25",
    "15,26",
    "15,27",
    "15,28",
    "16,28",
    "14,24",
    "14,25",
    "14,26",
    "17,27",
    "17,26",
    "18,26",
    "18,25",
    "19,25",
    "19,24",
    "20,24",
    "21,24",
    "22,24",
    "22,23",
    "22,13",
    "23,13",
    "22,14",
    "23,14",
    "24,14",
    "24,15",
    "25,15",
    "25,16",
    "26,16",
    "26,17",
    "27,17",
    "28,17",
    "29,17",
    "27,18",
    "28,18",
    "29,18",
    "28,19",
    "29,19",
    "29,20",
  ]),
};

export const plains = {
  type: TerrainType.PLAIN,
  coordinates: new Set(["1,1"]),
};
