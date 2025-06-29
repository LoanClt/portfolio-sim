import React, { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CustomParameterSet } from '../types/CustomParameterSet';
import { generateId } from '../utils/generateId';
import { showSuccess } from '../utils/showSuccess';

const usePortfolioData = () => {
  const [customParameterSets, setCustomParameterSets] = React.useState<CustomParameterSet[]>([]);
  const [user, setUser] = React.useState<boolean>(false);

  const addCustomParameterSet = useCallback(async (customSet: CustomParameterSet) => {
    try {
      console.log('Hook: addCustomParameterSet called with:', customSet);
      console.log('Hook: user is:', user ? 'authenticated' : 'not authenticated');
      console.log('Hook: current customParameterSets length:', customParameterSets.length);
      if (user) {
        // Save to database
        console.log('Hook: Saving to database');
        const dbRow = customSetToDbRow(customSet);
        console.log('Hook: dbRow created:', dbRow);
        
        // Remove id field completely to let database generate UUID
        const { id, ...insertRow } = dbRow;
        console.log('Hook: insertRow (without id):', insertRow);
        
        const { data, error } = await supabase
          .from('custom_parameter_sets')
          .insert(insertRow)
          .select()
          .single();

        if (error) {
          console.error('Hook: Database error:', error);
          throw error;
        }
        console.log('Hook: Database insert successful, data:', data);

        const newCustomSet = dbRowToCustomSet(data);
        console.log('Hook: Converted back to CustomParameterSet:', newCustomSet);
        setCustomParameterSets(prev => [...prev, newCustomSet]);
        console.log('Hook: State updated');
        showSuccess('Custom Set Created', `"${customSet.name}" has been saved to the cloud`);
      } else {
        // Save to localStorage
        console.log('Hook: Saving to localStorage');
        const newCustomSet = { ...customSet, id: customSet.id || generateId() };
        console.log('Hook: newCustomSet for localStorage:', newCustomSet);
        const updatedCustomSets = [...customParameterSets, newCustomSet];
        setCustomParameterSets(updatedCustomSets);
      }
    } catch (error) {
      console.error('Hook: Error adding custom parameter set:', error);
    }
  }, [customParameterSets, user]);

  return { customParameterSets, addCustomParameterSet };
};

export default usePortfolioData; 