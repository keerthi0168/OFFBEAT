import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateTravelPlan } from '@/utils/mlApi';

const TravelPlannerSection = ({ initialRegion = 'Any' }) => {
  const navigate = useNavigate();
  const [budget, setBudget] = useState(25000);
  const [numberOfDays, setNumberOfDays] = useState(5);
  const [preferredCategory, setPreferredCategory] = useState('Any');
  const [region, setRegion] = useState(initialRegion);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);

  const buildPlan = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await generateTravelPlan({
        budget: Number(budget),
        number_of_days: Number(numberOfDays),
        preferred_category: preferredCategory,
        region,
      });

      if (!response?.success) {
        setError(response?.message || 'Could not generate itinerary');
        setPlan(null);
        return;
      }

      setPlan(response);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Planner service unavailable');
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          id="planner-budget-input"
          name="budget"
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          min="1000"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          placeholder="Budget"
        />
        <input
          id="planner-days-input"
          name="numberOfDays"
          type="number"
          value={numberOfDays}
          onChange={(e) => setNumberOfDays(e.target.value)}
          min="1"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          placeholder="Number of days"
        />
        <select
          id="planner-category-select"
          name="preferredCategory"
          value={preferredCategory}
          onChange={(e) => setPreferredCategory(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="Any" className="bg-slate-900">Any Category</option>
          <option value="Beach" className="bg-slate-900">Beach</option>
          <option value="Hill Station" className="bg-slate-900">Hill Station</option>
          <option value="Temple" className="bg-slate-900">Temple</option>
          <option value="Adventure" className="bg-slate-900">Adventure</option>
          <option value="Wildlife" className="bg-slate-900">Wildlife</option>
          <option value="Garden" className="bg-slate-900">Nature/Garden</option>
        </select>
        <select
          id="planner-region-select"
          name="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="Any" className="bg-slate-900">Any Region</option>
          <option value="North" className="bg-slate-900">North</option>
          <option value="South" className="bg-slate-900">South</option>
          <option value="East" className="bg-slate-900">East</option>
          <option value="West" className="bg-slate-900">West</option>
          <option value="North East" className="bg-slate-900">North East</option>
        </select>
      </div>

      <button
        onClick={buildPlan}
        disabled={loading}
        className="mt-4 rounded-full bg-gradient-to-r from-[#1F8A8A] to-[#31A3A3] px-5 py-2 text-sm font-semibold text-white"
      >
        {loading ? 'Generating itinerary...' : 'Generate AI Itinerary'}
      </button>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      {plan?.itinerary?.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[#E5E7EB]/85">
            <div>Estimated total: ₹{Math.round(plan.summary?.estimated_total_cost || 0)}</div>
            <div className="mt-1">
              Route quality: <span className="text-[#C9A96E]">{Math.round(plan.summary?.route_quality_score || 0)}%</span>
            </div>
            <div className="mt-1 text-xs text-[#E5E7EB]/70">
              Regions covered: {(plan.summary?.covered_regions || []).join(', ') || 'N/A'}
            </div>
          </div>

          {plan.itinerary.map((dayPlan) => (
            <div key={dayPlan.day} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-[#C9A96E] text-sm font-medium">Day {dayPlan.day}</div>
              <button
                type="button"
                onClick={() => navigate(`/destination/${encodeURIComponent(dayPlan.destination?.place_name || '')}`)}
                className="mt-1 text-left text-white hover:text-[#C9A96E] transition"
              >
                {dayPlan.destination?.place_name}
              </button>
              <div className="text-xs text-[#E5E7EB]/70 mt-1">
                {dayPlan.destination?.category} • {dayPlan.destination?.region} • ₹{Math.round(dayPlan.estimated_day_cost || 0)}
              </div>
              <div className="text-xs text-[#E5E7EB]/60 mt-2">{dayPlan.highlight}</div>

              <div className="mt-2 text-xs text-[#E5E7EB]/75">
                Cost split: Stay ₹{Math.round(dayPlan.cost_breakdown?.stay || 0)} · Food ₹{Math.round(dayPlan.cost_breakdown?.food || 0)} · Local transport ₹{Math.round(dayPlan.cost_breakdown?.local_transport || 0)} · Activities ₹{Math.round(dayPlan.cost_breakdown?.activities || 0)}
              </div>

              {!!dayPlan.destination?.best_season?.length && (
                <div className="mt-2 text-xs text-[#E5E7EB]/70">
                  Best season: {dayPlan.destination.best_season.slice(0, 4).join(', ')}
                </div>
              )}

              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <div className="rounded-lg bg-white/5 p-2 text-xs text-emerald-200/90">
                  <span className="font-medium">Pros:</span>{' '}
                  {(dayPlan.pros || []).slice(0, 2).join(' • ') || 'Good local value'}
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-xs text-amber-200/90">
                  <span className="font-medium">Watchouts:</span>{' '}
                  {(dayPlan.cons || []).slice(0, 2).join(' • ') || 'Plan local commute ahead'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TravelPlannerSection;
