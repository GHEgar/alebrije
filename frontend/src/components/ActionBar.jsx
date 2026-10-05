import { useRef, useState } from 'react';
import { exportAvatarGlb } from '@/avatar/exportGlb';
import { normalizeAvatar } from '@/avatar/schema';
import { downloadBlob, readJsonFile } from '@/utils/download';
import { Button } from './Button';

const FILE_NAME = 'avatar-alebrije';

export const ActionBar = ({ avatar, onRandom, onImport }) => {
    const fileRef = useRef(null);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');

    const downloadGlb = async () => {
        setError('');
        setExporting(true);
        try {
            const glb = await exportAvatarGlb(avatar);
            downloadBlob(glb, `${FILE_NAME}.glb`, 'model/gltf-binary');
        } catch (cause) {
            console.error(cause);
            setError('No se pudo generar el archivo .glb.');
        } finally {
            setExporting(false);
        }
    };

    const exportJson = () => {
        downloadBlob(`${JSON.stringify(avatar, null, 4)}\n`, `${FILE_NAME}.json`, 'application/json');
    };

    const importJson = async (event) => {
        const [file] = event.target.files;
        event.target.value = '';
        if (!file) return;
        setError('');
        try {
            onImport(normalizeAvatar(await readJsonFile(file)));
        } catch {
            setError('El archivo no es un JSON de avatar válido.');
        }
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" label="Aleatorio" onClick={onRandom} />
                <Button variant="outline" label="Importar JSON" onClick={() => fileRef.current?.click()} />
                <Button variant="outline" label="Exportar JSON" onClick={exportJson} />
                <Button label="Descargar .glb" loading={exporting} onClick={downloadGlb} />
                <input ref={fileRef} type="file" accept="application/json,.json" onChange={importJson} className="hidden" aria-hidden="true" tabIndex={-1} />
            </div>
            {error && <p role="status" className="font-garetmedium text-xs text-[#B3261E]">{error}</p>}
        </div>
    );
};
