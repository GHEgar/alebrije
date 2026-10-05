import { useState } from 'react';
import { DEFAULT_AVATAR } from '@/avatar/definition';
import { randomAvatar } from '@/avatar/random';
import { ActionBar } from '@/components/ActionBar';
import { AvatarViewport } from '@/components/AvatarViewport';
import { ControlPanel } from '@/components/ControlPanel';

const App = () => {
    const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
    const [walking, setWalking] = useState(false);

    return (
        <div className="flex flex-col h-dvh bg-[#e9e8e8] text-[#191919]">
            <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white shadow-[0px_2px_12px_#4615521A]">
                <div>
                    <h1 className="font-garetbold text-xl text-[#5C2472]">Alebrije</h1>
                    <p className="font-garetmedium text-xs text-[#7C7C7C]">Creador de avatares del IIEG · v{__APP_VERSION__}</p>
                </div>
                <ActionBar avatar={avatar} onRandom={() => setAvatar(randomAvatar())} onImport={setAvatar} />
            </header>
            <main className="flex flex-col md:flex-row flex-1 min-h-0 gap-4 p-4">
                <aside className="md:w-[360px] shrink-0 overflow-y-auto rounded-[10px] bg-white shadow-[0px_3px_12px_#4615521A]">
                    <ControlPanel avatar={avatar} onChange={setAvatar} />
                </aside>
                <section className="flex-1 min-h-[360px]" aria-label="Vista previa del avatar">
                    <AvatarViewport avatar={avatar} walking={walking} onToggleWalk={() => setWalking((value) => !value)} />
                </section>
            </main>
        </div>
    );
};

export default App;
