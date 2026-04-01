pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * SupplyChainCompliance
 * =====================
 * Proves two compliance properties over IoT supply chain data:
 *
 *   P1 (Environmental) - every temperature reading <= maxTempThreshold
 *   P2 (Temporal)      - every transport time     <= maxTransportTime
 *
 * Circom arrays must have fixed size at compile time, so we use N_MAX
 * as the maximum capacity and nTemps/nTimes as the actual counts.
 * Unused slots MUST be filled with 0 (which is always <= any positive threshold).
 *
 * Public outputs:  p1Compliant (1 = ok, 0 = violation)
 *                  p2Compliant (1 = ok, 0 = violation)
 */
template SupplyChainCompliance(N_MAX) {

    // -- Public inputs --
    signal input maxTempThreshold;   // e.g. 4  (deg C)
    signal input maxTransportTime;   // e.g. 8  (hours)

    // -- Private inputs --
    signal input temperatures[N_MAX];
    signal input transportTimes[N_MAX];
    signal input nTemps;             // actual number of temperature readings (<= N_MAX)
    signal input nTimes;             // actual number of transport times     (<= N_MAX)

    // -- Public outputs --
    signal output p1Compliant;       // 1 if ALL temperatures   <= threshold
    signal output p2Compliant;       // 1 if ALL transport times <= SLA

    // ====================================================
    //  P1 - Temperature compliance
    // ====================================================
    //
    //  For each slot i:
    //    - if i < nTemps  -> real reading, check temperatures[i] <= maxTempThreshold
    //    - if i >= nTemps -> padding (0), always compliant
    //
    //  LessEqThan(n) works on values that fit in n bits.
    //  32 bits -> supports values up to 2^32 - 1.

    // Declare all signals and components in the initial scope
    component isActiveTemp[N_MAX];
    component tempLEQ[N_MAX];
    signal tempSlotFail[N_MAX];
    signal tempSlotOk[N_MAX];
    signal tempAcc[N_MAX + 1];

    tempAcc[0] <== 1;

    for (var i = 0; i < N_MAX; i++) {
        // Is this slot active? (i < nTemps)
        isActiveTemp[i] = LessThan(32);
        isActiveTemp[i].in[0] <== i;
        isActiveTemp[i].in[1] <== nTemps;

        // Is temperature[i] <= maxTempThreshold?
        tempLEQ[i] = LessEqThan(32);
        tempLEQ[i].in[0] <== temperatures[i];
        tempLEQ[i].in[1] <== maxTempThreshold;

        // Slot result:
        //   active=1 -> must pass  -> slotOk = tempLEQ.out (0 or 1)
        //   active=0 -> padding    -> slotOk = 1           (always ok)
        //
        // Formula: slotOk = 1 - isActive * (1 - tempLEQ.out)
        tempSlotFail[i] <== isActiveTemp[i].out * (1 - tempLEQ[i].out);
        tempSlotOk[i] <== 1 - tempSlotFail[i];

        tempAcc[i + 1] <== tempAcc[i] * tempSlotOk[i];
    }

    p1Compliant <== tempAcc[N_MAX];

    // ====================================================
    //  P2 - Transport time compliance
    // ====================================================

    component isActiveTime[N_MAX];
    component timeLEQ[N_MAX];
    signal timeSlotFail[N_MAX];
    signal timeSlotOk[N_MAX];
    signal timeAcc[N_MAX + 1];

    timeAcc[0] <== 1;

    for (var i = 0; i < N_MAX; i++) {
        isActiveTime[i] = LessThan(32);
        isActiveTime[i].in[0] <== i;
        isActiveTime[i].in[1] <== nTimes;

        timeLEQ[i] = LessEqThan(32);
        timeLEQ[i].in[0] <== transportTimes[i];
        timeLEQ[i].in[1] <== maxTransportTime;

        timeSlotFail[i] <== isActiveTime[i].out * (1 - timeLEQ[i].out);
        timeSlotOk[i] <== 1 - timeSlotFail[i];

        timeAcc[i + 1] <== timeAcc[i] * timeSlotOk[i];
    }

    p2Compliant <== timeAcc[N_MAX];
}

// Main component: N_MAX = 32 slots
component main {public [maxTempThreshold, maxTransportTime]} = SupplyChainCompliance(32);
