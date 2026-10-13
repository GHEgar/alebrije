import { useRef, useState, type ChangeEvent } from 'react';
import { exportAvatarGlb, parseAvatar, type AvatarDefinition } from 'alebrije';

const FILE_NAME = 'avatar-alebrije';

const download = (data: BlobPart, filename: string, type: string): void => {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

interface ActionBarProps {
    avatar: AvatarDefinition;
    onRandom: () => void;
    onImport: (avatar: AvatarDefinition) => void;
}

export function ActionBar({ avatar, onRandom, onImport }: ActionBarProps) {
    const file = useRef<HTMLInputElement>(null);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');

    const downloadGlb = async (): Promise<void> => {
        setError('');
        setExporting(true);
        try {
            download(await exportAvatarGlb(avatar), `${FILE_NAME}.glb`, 'model/gltf-binary');
        } catch (cause) {
            console.error(cause);
            setError('No se pudo generar el archivo .glb.');
        } finally {
            setExporting(false);
        }
    };

    const importJson = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const selected = event.target.files?.[0];
        event.target.value = '';
        if (!selected) return;
        setError('');
        try {
            onImport(parseAvatar(JSON.parse(await selected.text())));
        } catch {
            setError('El archivo no es un JSON de avatar válido.');
        }
    };

    return (
        <div className="actions">
            <div className="buttons">
                <button type="button" className="button" onClick={onRandom}>Aleatorio</button>
                <button type="button" className="button" onClick={() => file.current?.click()}>Importar JSON</button>
                <button type="button" className="button" onClick={() => download(`${JSON.stringify(avatar, null, 4)}\n`, `${FILE_NAME}.json`, 'application/json')}>Exportar JSON</button>
                <button type="button" className="button primary" disabled={exporting} aria-busy={exporting} onClick={downloadGlb}>
                    {exporting ? 'Generando…' : 'Descargar .glb'}
                </button>
                <input ref={file} type="file" accept="application/json,.json" onChange={importJson} hidden />
            </div>
            {error && <p role="status" className="error">{error}</p>}
        </div>
    );
}
