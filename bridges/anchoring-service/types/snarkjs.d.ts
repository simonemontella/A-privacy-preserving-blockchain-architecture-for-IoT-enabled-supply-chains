/**
 * Type declarations for snarkjs
 * snarkjs does not ship its own TypeScript types.
 */
declare module 'snarkjs' {
    export namespace groth16 {
        function fullProve(
            input: Record<string, unknown>,
            wasmPath: string,
            zkeyPath: string
        ): Promise<{ proof: object; publicSignals: string[] }>;

        function verify(
            verificationKey: object,
            publicSignals: string[],
            proof: object
        ): Promise<boolean>;

        function exportSolidityCallData(
            proof: object,
            publicSignals: string[]
        ): Promise<string>;
    }

    export namespace plonk {
        function fullProve(
            input: Record<string, unknown>,
            wasmPath: string,
            zkeyPath: string
        ): Promise<{ proof: object; publicSignals: string[] }>;

        function verify(
            verificationKey: object,
            publicSignals: string[],
            proof: object
        ): Promise<boolean>;
    }

    export namespace zKey {
        function exportVerificationKey(zkeyPath: string): Promise<object>;
        function exportSolidityVerifier(zkeyPath: string, templatePath?: string): Promise<string>;
    }
}
