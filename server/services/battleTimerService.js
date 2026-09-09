const activeBattles = new Map();

function startBattle(
  battleId,
  durationSeconds
) {
  const id = String(battleId);

  const startedAt =
    Date.now();

  activeBattles.set(id, {
    startedAt,
    durationSeconds,
  });

  return {
    startedAt,
    durationSeconds,
  };
}

function getBattleTimer(
  battleId
) {
  const battle =
    activeBattles.get(
      String(battleId)
    );

  if (!battle) {
    return null;
  }

  const elapsedSeconds =
    Math.floor(
      (Date.now() -
        battle.startedAt) /
        1000
    );

  const remainingSeconds =
    Math.max(
      0,
      battle.durationSeconds -
        elapsedSeconds
    );

  return {
    startedAt:
      battle.startedAt,

    durationSeconds:
      battle.durationSeconds,

    remainingSeconds,
  };
}

function isBattleActive(
  battleId
) {
  const timer =
    getBattleTimer(
      battleId
    );

  if (!timer) {
    return false;
  }

  return (
    timer.remainingSeconds >
    0
  );
}

function endBattle(
  battleId
) {
  activeBattles.delete(
    String(battleId)
  );
}

module.exports = {
  startBattle,
  getBattleTimer,
  isBattleActive,
  endBattle,
};