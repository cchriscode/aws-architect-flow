/** Commitment discount rates (EC2 / general) */
export const COMMITMENT_DISCOUNT = { "3yr": 0.34, "1yr": 0.65, none: 1.0 } as const;

/** Fargate-specific commitment discount rates */
export const FARGATE_COMMITMENT_DISCOUNT = { "3yr": 0.48, "1yr": 0.78, none: 1.0 } as const;

/** Spot instance discount rates */
export const SPOT_DISCOUNT = { heavy: 0.30, partial: 0.70, no: 1.0 } as const;

/** DAU scale coefficients */
export const DAU_SCALE = { xlarge: 8, large: 4, medium: 2, small: 1, tiny: 0.5 } as const;

/** Certifications that count as critical compliance */
export const CRITICAL_CERTS = ["pci", "hipaa", "sox"] as const;
