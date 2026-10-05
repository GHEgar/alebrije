export const computeProportions = ({ body }) => {
    const H = body.height;
    const w = 0.8 + 0.5 * body.build;
    const footHeight = 0.04 * H;
    const lowerLeg = 0.225 * H;
    const upperLeg = 0.235 * H;
    const hipY = footHeight + lowerLeg + upperLeg;
    const torsoTop = 0.095 * H * w;
    const armRadius = 0.026 * H * w;
    return {
        H,
        w,
        footHeight,
        lowerLeg,
        upperLeg,
        hipY,
        hipX: 0.05 * H * w,
        legRadius: 0.034 * H * w,
        shinRadius: 0.028 * H * w,
        spineY: 0.6 * H,
        shoulderY: 0.815 * H,
        neckY: 0.84 * H,
        headY: 0.915 * H,
        headRadius: 0.068 * H,
        torsoTop,
        torsoBottom: 0.08 * H * w,
        torsoDepth: 0.62,
        shoulderX: torsoTop + armRadius * 0.9,
        armRadius,
        forearmRadius: armRadius * 0.85,
        upperArm: 0.17 * H,
        lowerArm: 0.15 * H,
        handRadius: 0.03 * H,
    };
};
