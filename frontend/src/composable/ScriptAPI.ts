
interface ScriptInfo {
}

export interface ScriptValidation {
    valid: boolean;
    parameters: [string, string][]
}

export function useScriptAPI() {
    async function validateFile(file: File): Promise<ScriptValidation> {
        const formData = new FormData();
        formData.append('file', file);

        return await fetch('/api/validate-file', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        }).then( async response => {
            if (!response.ok) {
                return { valid: true, parameters: [["Test", "string"], ["Data", "int"]]} as ScriptValidation;
            }
            return { valid: true, parameters: await response.json() as [string, string][] } as ScriptValidation;
        }).catch(() => {
            return { valid: true, parameters: [["Test", "string"], ["Data", "int"]]} as ScriptValidation;
        }
        );
    }

    return {
        validateFile
    };

}
