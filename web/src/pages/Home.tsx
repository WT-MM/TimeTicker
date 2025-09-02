import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Category, TimeLog } from '../types';

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLogByCategoryId, setActiveLogByCategoryId] = useState<
    Record<string, TimeLog | undefined>
  >({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [swipedCategoryId, setSwipedCategoryId] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: cats, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (catErr) {
      setError(catErr.message);
      setLoading(false);
      return;
    }
    setCategories(cats ?? []);

    const { data: logs } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .is('ended_at', null);
    const map: Record<string, TimeLog | undefined> = {};
    (logs ?? []).forEach((l) => (map[l.category_id] = l));
    setActiveLogByCategoryId(map);
    setLoading(false);
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategoryName.trim(), user_id: user.id })
      .select()
      .single();
    if (error) {
      setError(error.message);
    } else {
      setCategories((prev) => [...prev, data]);
      setNewCategoryName('');
    }
  }

  const deleteCategory = useCallback(async (categoryId: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
    if (error) {
      setError(error.message);
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setActiveLogByCategoryId((prev) => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });
      setSwipedCategoryId(null);
    }
  }, []);

  const toggleTimer = useCallback(
    async (categoryId: string) => {
      const active = activeLogByCategoryId[categoryId];
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      if (!active) {
        const { data, error } = await supabase
          .from('time_logs')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            started_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) {
          setError(error.message);
        } else {
          setActiveLogByCategoryId((prev) => ({ ...prev, [categoryId]: data }));
        }
      } else {
        const endedAt = new Date();
        const startedAt = new Date(active.started_at);
        const durationSeconds = Math.max(
          0,
          Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
        );
        const { error } = await supabase
          .from('time_logs')
          .update({
            ended_at: endedAt.toISOString(),
            duration_seconds: durationSeconds,
          })
          .eq('id', active.id);
        if (error) {
          setError(error.message);
        } else {
          setActiveLogByCategoryId((prev) => {
            const updated = { ...prev };
            delete updated[categoryId];
            return updated;
          });
        }
      }
    },
    [activeLogByCategoryId]
  );

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwipedCategoryId(null);
  }

  function handleTouchMove(e: React.TouchEvent, categoryId: string) {
    const touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    const deltaX = touchStartX.current - touchCurrentX;
    const deltaY = Math.abs(touchStartY.current - touchCurrentY);

    // Only trigger swipe left (positive deltaX) to reveal delete
    if (deltaX > 50 && deltaY < 100) {
      setSwipedCategoryId(categoryId);
    } else if (deltaX < -20) {
      setSwipedCategoryId(null);
    }
  }

  function handleTouchEnd() {
    // Touch end - could add auto-close after delay if desired
  }

  const categoryRows = useMemo(() => {
    return categories.map((c) => {
      const active = activeLogByCategoryId[c.id];
      const isSwiped = swipedCategoryId === c.id;
      return (
        <li
          key={c.id}
          className="relative overflow-hidden border rounded"
          onTouchStart={handleTouchStart}
          onTouchMove={(e) => handleTouchMove(e, c.id)}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`flex items-center justify-between p-3 transition-transform duration-200 bg-white relative z-10 ${isSwiped ? '-translate-x-20' : 'translate-x-0'}`}
          >
            <div className="flex items-center gap-3">
              <span className="font-medium">{c.name}</span>
              {active && (
                <span className="text-xs text-green-700">Running…</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleTimer(c.id)}
                className="px-3 py-1 rounded bg-gray-900 text-white"
              >
                {active ? 'Stop' : 'Start'}
              </button>
            </div>
          </div>
          {/* Swipe-to-delete action - hidden behind the main content */}
          <div className="absolute right-0 top-0 h-full w-20 bg-red-500 flex items-center justify-center z-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteCategory(c.id);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="text-white font-medium text-sm"
            >
              Delete
            </button>
          </div>
        </li>
      );
    });
  }, [
    categories,
    activeLogByCategoryId,
    swipedCategoryId,
    toggleTimer,
    deleteCategory,
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <form onSubmit={addCategory} className="flex gap-2">
        <input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="New category name"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded bg-gray-900 text-white"
        >
          Add
        </button>
      </form>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <ul className="space-y-2">{categoryRows}</ul>
      )}
    </div>
  );
}
