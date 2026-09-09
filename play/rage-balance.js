// Rainbow Rampage rage balance pass.
// Reduce rage gained from gameplay rewards so rage mode has to be earned over longer runs.
(function () {
  const originalAddRage = window.addRage;
  if (typeof originalAddRage !== "function") return;

  // 25% of the previous 50% balance pass = 12.5% of the original rage gain.
  const RAGE_GAIN_MULTIPLIER = 0.125;

  window.addRage = function (amount) {
    return originalAddRage(amount * RAGE_GAIN_MULTIPLIER);
  };
})();
