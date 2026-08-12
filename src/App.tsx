import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import AuthGate from './pages/AuthGate';
import AlphabetModule from './components/alphabet/AlphabetModule';
import WordsModule from './components/words/WordsModule';
import MyWordsPage from './pages/MyWordsPage';
import GrammarModule from './components/grammar/GrammarModule';
import DictionaryModule from './components/dictionary/DictionaryModule';
import StageMap from './components/story/StageMap';
import { useUser } from './hooks/useUser';

function App() {
  const { firebaseUser, userProfile, loading } = useUser();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return <AuthGate />;
  }

  return (
    <BrowserRouter>
      <Layout userProfile={userProfile}>
        <Routes>
          <Route
            path="/"
            element={<Home userId={firebaseUser.uid} userName={userProfile?.displayName ?? firebaseUser.displayName ?? 'Друг'} />}
          />
          <Route path="/alphabet" element={<AlphabetModule userId={firebaseUser.uid} />} />
          <Route path="/words" element={<WordsModule userId={firebaseUser.uid} />} />
          <Route path="/my-words" element={<MyWordsPage userId={firebaseUser.uid} />} />
          <Route path="/grammar" element={<GrammarModule userId={firebaseUser.uid} />} />
          <Route path="/dictionary" element={<DictionaryModule userId={firebaseUser.uid} />} />
          <Route path="/stage-map" element={<StageMap />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
