import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VOCAB_CATEGORIES } from '../../data/vocabulary';
import type { VocabWord } from '../../types';
import useCloudTTS from '../../hooks/useCloudTTS';
import { getVocalizedForm } from '../../data/nikudWords';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import styles from './DictionaryModule.module.css';

interface DictionaryModuleProps {
  userId?: string;
}

const DictionaryModule: React.FC<DictionaryModuleProps> = (_props) => {
  const navigate = useNavigate();
  const { playAudio } = useCloudTTS();
  const { playClick } = useSoundEffects();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Flatten all words from all categories
  const allWords: (VocabWord & { categoryName: string; categoryIcon: string })[] = useMemo(() => {
    return VOCAB_CATEGORIES.flatMap((cat) =>
      cat.words.map((w) => ({
        ...w,
        categoryName: cat.name,
        categoryIcon: cat.icon,
      }))
    );
  }, []);

  // Filter words based on search query and active category
  const filteredWords = useMemo(() => {
    let result = allWords;

    if (activeCategory !== 'all') {
      result = result.filter((w) => w.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (w) =>
          w.translation.toLowerCase().includes(query) ||
          w.hebrew.includes(query) ||
          w.transliteration.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allWords, activeCategory, searchQuery]);

  const handleTTS = (hebrew: string) => {
    playAudio(hebrew);
  };

  const handleCategoryClick = (categoryId: string) => {
    playClick();
    setActiveCategory(categoryId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📖 Русско-Ивритский Словарь</h1>
          <p className={styles.subtitle}>
            Полный словарь с транскрипцией — ищи, слушай и запоминай слова!
          </p>
        </div>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← Назад
        </button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Поиск по русскому значению, ивриту или транскрипции..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {searchQuery && (
          <button
            className={styles.clearBtn}
            onClick={() => setSearchQuery('')}
            title="Очистить поиск"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className={styles.categoriesRow}>
        <button
          className={`${styles.catBtn} ${activeCategory === 'all' ? styles.catBtnActive : ''}`}
          onClick={() => handleCategoryClick('all')}
        >
          📋 Все ({allWords.length})
        </button>
        {VOCAB_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.catBtn} ${activeCategory === cat.id ? styles.catBtnActive : ''}`}
            onClick={() => handleCategoryClick(cat.id)}
          >
            {cat.icon} {cat.name} ({cat.words.length})
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className={styles.resultsInfo}>
        Найдено слов: <strong>{filteredWords.length}</strong>
        {activeCategory !== 'all' && (
          <span className={styles.filterBadge}>
            • Фильтр: {VOCAB_CATEGORIES.find((c) => c.id === activeCategory)?.name}
          </span>
        )}
      </div>

      {/* Dictionary Table */}
      {filteredWords.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.dictTable}>
            <thead>
              <tr>
                <th className={styles.colIndex}>#</th>
                <th className={styles.colRu}>🇷🇺 Русский</th>
                <th className={styles.colHe}>🇮🇱 Иврит</th>
                <th className={styles.colVocalized}>🎤 С огласовкой</th>
                <th className={styles.colTranslit}>🔤 Транскрипция</th>
                <th className={styles.colCat}>📂 Категория</th>
                <th className={styles.colAudio}>🔊</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.map((word, idx) => (
                <tr key={word.id} className={styles.wordRow}>
                  <td className={styles.colIndex}>{idx + 1}</td>
                  <td className={styles.colRu}>
                    <span className={styles.ruWord}>{word.translation}</span>
                    {word.mnemonic && (
                      <span className={styles.mnemonic} title={word.mnemonic}>
                        💡
                      </span>
                    )}
                  </td>
                  <td className={styles.colHe}>
                    <span className={styles.heWord} dir="rtl">
                      {word.hebrew}
                    </span>
                  </td>
                  <td className={styles.colVocalized}>
                    <span className={styles.heWord} dir="rtl">
                      {getVocalizedForm(word.hebrew)}
                    </span>
                  </td>
                  <td className={styles.colTranslit}>
                    <span className={styles.translitWord}>[{word.transliteration}]</span>
                  </td>
                  <td className={styles.colCat}>
                    <span className={styles.catBadge}>
                      {word.categoryIcon} {word.categoryName}
                    </span>
                  </td>
                  <td className={styles.colAudio}>
                    <button
                      className={styles.audioBtn}
                      onClick={() => handleTTS(word.hebrew)}
                      title="Прослушать произношение"
                    >
                      🔊
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📭</span>
          <h3>Ничего не найдено</h3>
          <p>
            Попробуй изменить поисковый запрос или выбрать другую категорию.
          </p>
        </div>
      )}

      {/* Footer Stats */}
      <div className={styles.footer}>
        <p>
          Всего в словаре: <strong>{allWords.length}</strong> слов •{' '}
          <strong>{VOCAB_CATEGORIES.length}</strong> категорий
        </p>
      </div>
    </div>
  );
};

export default DictionaryModule;