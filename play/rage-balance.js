// Rainbow Rampage rage balance pass.
// Reduce rage gained from gameplay rewards so rage mode has to be earned over longer runs.
(function () {
  const originalAddRage = window.addRage;
  if (typeof originalAddRage !== "function") return;

  const RAGE_GAIN_MULTIPLIER = 0.5;

  window.addRage = function (amount) {
    return originalAddRage(amount * RAGE_GAIN_MULTIPLIER);
  };
})();
