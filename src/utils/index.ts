import { Position, TerrainType } from "../types";
import { mountains, water } from "../constants";

export const getTerrainTypeByPosition = (position: Position): TerrainType => {
  if (mountains.coordinates.has(position)) {
    return TerrainType.MOUNTAIN;
  } else if (water.coordinates.has(position)) {
    return TerrainType.RIVER;
  } else {
    return TerrainType.PLAIN;
  }
};

export function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries: number = 5,
  backoffTime: number = 1000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const retry = (attempt: number) => {
      fn()
        .then(resolve)
        .catch((error) => {
          if (attempt < maxRetries) {
            setTimeout(() => retry(attempt + 1), backoffTime * attempt);
          } else {
            reject(error);
          }
        });
    };
    retry(0);
  });
}
