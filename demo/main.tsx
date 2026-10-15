import 'rotulo';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_AVATAR, randomAvatar } from 'alebrije';
import { ActionBar } from './ActionBar';
import { ControlPanel } from './ControlPanel';
import { Viewport } from './Viewport';

function App() {
    const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
    const [walking, setWalking] = useState(false);

    return (
        <div className="app">
            <header className="header">
                <h1>alebrije <a className="link" href="./mapa.html">map</a></h1>
                <ActionBar avatar={avatar} onRandom={() => setAvatar(randomAvatar())} onImport={setAvatar} />
            </header>
            <main className="main">
                <aside className="panel">
                    <ControlPanel avatar={avatar} onChange={setAvatar} />
                </aside>
                <section className="stage" aria-label="Avatar preview">
                    <Viewport avatar={avatar} walking={walking} onToggleWalk={() => setWalking((value) => !value)} />
                </section>
            </main>
        </div>
    );
}

const root = document.getElementById('root');
if (root) {
    createRoot(root).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}
