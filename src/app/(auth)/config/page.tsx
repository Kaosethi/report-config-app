// src/app/(auth)/config/page.tsx
'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth, AuthContextType } from '@/context/AuthContext';
import { formatTaxId, validateTaxId } from '@/lib/utils';

// --- Interfaces --- (Same as before, with all rate fields)
interface Merchant {
    id: string; name: string; taxId: string; paycloudMerchantId: string; settlementDayN: number;
    serviceCostRate: number; agentShareRate: number; flybridgeShareRate: number; payforuShareRate: number;
    payforuInternalETransferRate: number; payforuInternalOverheadRate: number;
    payforuInternalOtherCostRate: number; payforuInternalProfitRate: number;
}
interface Agent { id: string; name: string; merchants: Merchant[]; }
interface MerchantFormData {
    merchantName: string; merchantTaxId: string; paycloudMerchantId: string; settlementDayN: string;
    serviceCostRate: string; agentShareRate: string; flybridgeShareRate: string; payforuShareRate: string;
    payforuInternalETransferRate: string; payforuInternalOverheadRate: string;
    payforuInternalOtherCostRate: string; payforuInternalProfitRate: string;
}
interface MerchantFormErrors {
    merchantName?: string; merchantTaxId?: string; paycloudMerchantId?: string; settlementDayN?: string;
    serviceCostRate?: string; agentShareRate?: string; flybridgeShareRate?: string; payforuShareRate?: string; tier1SumError?: string;
    payforuInternalETransferRate?: string; payforuInternalOverheadRate?: string;
    payforuInternalOtherCostRate?: string; payforuInternalProfitRate?: string; tier2SumError?: string;
}

const initialMerchantFormState: MerchantFormData = {
    merchantName: '', merchantTaxId: '', paycloudMerchantId: '', settlementDayN: '',
    serviceCostRate: '', agentShareRate: '', flybridgeShareRate: '', payforuShareRate: '',
    payforuInternalETransferRate: '', payforuInternalOverheadRate: '',
    payforuInternalOtherCostRate: '', payforuInternalProfitRate: ''
};

// --- Main Component ---
export default function ConfigPage() {
    const auth: AuthContextType = useAuth();
    const { logout } = auth;

    const [agents, setAgents] = useState<Agent[]>([]);
    const [newAgentName, setNewAgentName] = useState<string>('');
    const [managingMerchantForAgentId, setManagingMerchantForAgentId] = useState<string | null>(null);
    const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
    const [merchantForm, setMerchantForm] = useState<MerchantFormData>({...initialMerchantFormState});
    const [merchantFormErrors, setMerchantFormErrors] = useState<MerchantFormErrors>({});
    const [isLoaded, setIsLoaded] = useState(false);

    const isFormOpen = !!managingMerchantForAgentId; // True if Add or Edit Merchant form is open
    const isEditing = isFormOpen && !!editingMerchantId;

    // --- Effects --- (useEffect for loading and saving remains the same)
    useEffect(() => { /* ... Loading logic from previous correct version ... */
        try {
            const storedData = localStorage.getItem('reportConfigData');
            if (storedData) {
                const parsedData: Agent[] = JSON.parse(storedData);
                if (Array.isArray(parsedData)) {
                    const validatedData = parsedData.map(agent => ({
                        ...agent,
                        merchants: agent.merchants.map(merchant => ({
                            ...merchant,
                            settlementDayN: typeof merchant.settlementDayN === 'number' ? merchant.settlementDayN : 1,
                            paycloudMerchantId: typeof merchant.paycloudMerchantId === 'string' ? merchant.paycloudMerchantId : '',
                            serviceCostRate: typeof merchant.serviceCostRate === 'number' ? merchant.serviceCostRate : 0,
                            agentShareRate: typeof merchant.agentShareRate === 'number' ? merchant.agentShareRate : 0,
                            flybridgeShareRate: typeof merchant.flybridgeShareRate === 'number' ? merchant.flybridgeShareRate : 0,
                            payforuShareRate: typeof merchant.payforuShareRate === 'number' ? merchant.payforuShareRate : 0,
                            payforuInternalETransferRate: typeof merchant.payforuInternalETransferRate === 'number' ? merchant.payforuInternalETransferRate : 0,
                            payforuInternalOverheadRate: typeof merchant.payforuInternalOverheadRate === 'number' ? merchant.payforuInternalOverheadRate : 0,
                            payforuInternalOtherCostRate: typeof merchant.payforuInternalOtherCostRate === 'number' ? merchant.payforuInternalOtherCostRate : 0,
                            payforuInternalProfitRate: typeof merchant.payforuInternalProfitRate === 'number' ? merchant.payforuInternalProfitRate : 0,
                        }))
                    }));
                    setAgents(validatedData);
                } else { localStorage.removeItem('reportConfigData'); }
            }
        } catch (error) { console.error("Parse error:", error); localStorage.removeItem('reportConfigData'); }
        finally { setIsLoaded(true); }
    }, []);

    useEffect(() => {
        if (isLoaded) {
            try { localStorage.setItem('reportConfigData', JSON.stringify(agents)); }
            catch(error) { console.error("Save error:", error); }
        }
    }, [agents, isLoaded]);


    // --- Agent Handling ---
    const handleAddAgent = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newAgentName.trim() || isFormOpen) return; // Prevent adding if merchant form is open
        const newAgent: Agent = { id: Date.now().toString(), name: newAgentName.trim(), merchants: [] };
        setAgents(prevAgents => [...prevAgents, newAgent]);
        setNewAgentName('');
    };
    const handleDeleteAgent = (agentIdToDelete: string) => {
        if (isFormOpen) return; // Prevent deleting if merchant form is open
        const agentName = agents.find(a => a.id === agentIdToDelete)?.name || 'this agent';
        if (window.confirm(`Are you sure you want to delete agent "${agentName}" and all associated merchants? This cannot be undone.`)) {
            setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentIdToDelete));
        }
     };

    // --- Merchant Form & CRUD ---
    const handleMerchantInputChange = (e: ChangeEvent<HTMLInputElement>) => { /* ... Same as previous correct version ... */
        const { name, value } = e.target;
        const fieldName = name as keyof MerchantFormData;
        let processedValue = value;
        if (fieldName === 'merchantTaxId') { processedValue = formatTaxId(value); }
        else if (fieldName === 'settlementDayN') { processedValue = value.replace(/\D/g, ''); }
        else if (Object.keys(initialMerchantFormState).includes(fieldName) && (fieldName.toLowerCase().includes('rate') || fieldName.toLowerCase().includes('cost'))) {
            const numericValue = value.replace(/[^0-9.]/g, '');
            const parts = numericValue.split('.');
            processedValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : numericValue;
        }
        setMerchantForm(prevForm => ({ ...prevForm, [fieldName]: processedValue }));
        if (merchantFormErrors[fieldName]) setMerchantFormErrors(prevErrors => ({ ...prevErrors, [fieldName]: undefined }));
        if (fieldName.startsWith('payforuInternal') && merchantFormErrors.tier2SumError) setMerchantFormErrors(prevErrors => ({ ...prevErrors, tier2SumError: undefined }));
        if (['agentShareRate', 'flybridgeShareRate', 'payforuShareRate', 'serviceCostRate'].includes(fieldName) && merchantFormErrors.tier1SumError) setMerchantFormErrors(prevErrors => ({ ...prevErrors, tier1SumError: undefined }));
    };

    const validateMerchantForm = (): boolean => { // Validation logic including sum checks should be correct from previous
        const errors: MerchantFormErrors = {};
        if (!merchantForm.merchantName.trim()) errors.merchantName = 'Merchant Name is required.';
        if (!validateTaxId(merchantForm.merchantTaxId)) errors.merchantTaxId = 'Invalid Tax ID.';
        if (!merchantForm.paycloudMerchantId.trim()) errors.paycloudMerchantId = 'PayCloud Merchant ID is required.';
        const settlementN = parseInt(merchantForm.settlementDayN, 10);
        if (isNaN(settlementN) || settlementN < 0) errors.settlementDayN = 'Settlement Day (n) >= 0.';

        const rateFields: (keyof MerchantFormData)[] = ['serviceCostRate', 'agentShareRate', 'flybridgeShareRate', 'payforuShareRate', 'payforuInternalETransferRate', 'payforuInternalOverheadRate', 'payforuInternalOtherCostRate', 'payforuInternalProfitRate'];
        const parsedRates: Partial<Record<keyof MerchantFormData, number>> = {};
        let hasIndividualRateError = false;
        rateFields.forEach(field => {
            const val = parseFloat(merchantForm[field]);
            if (isNaN(val) || val < 0) {
                errors[field] = 'Must be a non-negative number.';
                hasIndividualRateError = true;
            } else { parsedRates[field] = val; }
        });

        if (!hasIndividualRateError) { // Only check sums if individual fields are valid numbers
            const serviceCost = parsedRates.serviceCostRate ?? 0;
            const agentShare = parsedRates.agentShareRate ?? 0;
            const flybridgeShare = parsedRates.flybridgeShareRate ?? 0;
            const payforuShareTier1 = parsedRates.payforuShareRate ?? 0;
            const tier1Sum = parseFloat((agentShare + flybridgeShare + payforuShareTier1).toPrecision(10)); // Use toPrecision for better sum
            if (tier1Sum !== parseFloat(serviceCost.toPrecision(10))) {
                errors.tier1SumError = `Tier 1 sum (${tier1Sum}%) must equal Service Cost (${serviceCost}%).`;
            }

            const pfuInternalETransfer = parsedRates.payforuInternalETransferRate ?? 0;
            const pfuInternalOverhead = parsedRates.payforuInternalOverheadRate ?? 0;
            const pfuInternalOtherCost = parsedRates.payforuInternalOtherCostRate ?? 0;
            const pfuInternalProfit = parsedRates.payforuInternalProfitRate ?? 0;
            const tier2Sum = parseFloat((pfuInternalETransfer + pfuInternalOverhead + pfuInternalOtherCost + pfuInternalProfit).toPrecision(10));
            if (tier2Sum !== parseFloat(payforuShareTier1.toPrecision(10))) {
                errors.tier2SumError = `Tier 2 sum (${tier2Sum}%) must equal PayForU Share (${payforuShareTier1}%).`;
            }
        }
        setMerchantFormErrors(errors);
        return Object.keys(errors).length === 0;
     };

    const resetAndCloseForm = () => { /* ... Same as previous correct version ... */
        setManagingMerchantForAgentId(null);
        setEditingMerchantId(null);
        setMerchantForm({...initialMerchantFormState});
        setMerchantFormErrors({});
    };
    const handleMerchantSubmit = (e: FormEvent<HTMLFormElement>) => { /* ... Same as previous correct version ... */
        e.preventDefault();
        if (!validateMerchantForm() || !managingMerchantForAgentId) return;
        const merchantDataFromForm: Omit<Merchant, 'id'> = {
            name: merchantForm.merchantName.trim(), taxId: merchantForm.merchantTaxId, paycloudMerchantId: merchantForm.paycloudMerchantId.trim(),
            settlementDayN: parseInt(merchantForm.settlementDayN, 10), serviceCostRate: parseFloat(merchantForm.serviceCostRate),
            agentShareRate: parseFloat(merchantForm.agentShareRate), flybridgeShareRate: parseFloat(merchantForm.flybridgeShareRate),
            payforuShareRate: parseFloat(merchantForm.payforuShareRate), payforuInternalETransferRate: parseFloat(merchantForm.payforuInternalETransferRate),
            payforuInternalOverheadRate: parseFloat(merchantForm.payforuInternalOverheadRate), payforuInternalOtherCostRate: parseFloat(merchantForm.payforuInternalOtherCostRate),
            payforuInternalProfitRate: parseFloat(merchantForm.payforuInternalProfitRate),
        };
        if (isEditing && editingMerchantId) {
            setAgents(prevAgents => prevAgents.map(agent => agent.id === managingMerchantForAgentId ? { ...agent, merchants: agent.merchants.map(m => m.id === editingMerchantId ? { ...m, ...merchantDataFromForm } : m) } : agent ));
        } else {
            const newMerchant: Merchant = { ...merchantDataFromForm, id: Date.now().toString() };
            setAgents(prevAgents => prevAgents.map(agent => agent.id === managingMerchantForAgentId ? { ...agent, merchants: [...agent.merchants, newMerchant] } : agent ));
        }
        resetAndCloseForm();
    };
    const startEditMerchant = (agentId: string, merchant: Merchant) => { /* ... Same as previous correct version ... */
        setManagingMerchantForAgentId(agentId);
        setEditingMerchantId(merchant.id);
        setMerchantForm({
             merchantName: merchant.name, merchantTaxId: merchant.taxId, paycloudMerchantId: merchant.paycloudMerchantId || '', settlementDayN: String(merchant.settlementDayN),
             serviceCostRate: String(merchant.serviceCostRate), agentShareRate: String(merchant.agentShareRate), flybridgeShareRate: String(merchant.flybridgeShareRate),
             payforuShareRate: String(merchant.payforuShareRate), payforuInternalETransferRate: String(merchant.payforuInternalETransferRate),
             payforuInternalOverheadRate: String(merchant.payforuInternalOverheadRate), payforuInternalOtherCostRate: String(merchant.payforuInternalOtherCostRate),
             payforuInternalProfitRate: String(merchant.payforuInternalProfitRate),
         });
         setMerchantFormErrors({});
    };
    const openAddMerchantForm = (agentId: string) => { /* ... Same as previous correct version ... */
        if (isFormOpen) return; // Prevent opening another if one is already open for a different agent
        setManagingMerchantForAgentId(agentId);
        setEditingMerchantId(null);
        setMerchantForm({...initialMerchantFormState});
        setMerchantFormErrors({});
    };
    const handleDeleteMerchant = (agentId: string, merchantIdToDelete: string, merchantName: string) => {
        if (isFormOpen) return; // Prevent deleting if merchant form is open
        if (window.confirm(`Are you sure you want to delete merchant "${merchantName}"? This cannot be undone.`)) {
            setAgents(prevAgents => prevAgents.map(agent => {
                 if (agent.id === agentId) {
                     const updatedMerchants = agent.merchants.filter(merchant => merchant.id !== merchantIdToDelete);
                     return { ...agent, merchants: updatedMerchants };
                 }
                 return agent;
            }));
            // No need to close form here as delete is disabled when form is open
        }
    };

    // --- Styles --- (Same as before)
    const btnBase = "py-2 px-4 rounded font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed";
    const btnPrimary = `${btnBase} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
    const btnSecondary = `${btnBase} bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500`;
    const btnDanger = `${btnBase} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
    const btnSmallBase = "px-2 py-1 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
    const btnSmallDanger = `${btnSmallBase} bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500`;
    const btnSmallEdit = `${btnSmallBase} bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500`;
    const inputBase = "border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100";
    const errorText = "text-red-600 text-sm mt-1";


    if (!isLoaded || auth.loading) {
       return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p className="text-gray-600 text-lg">Loading Configuration...</p></div>;
    }

    // --- Render UI ---
    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-300">
                    <h1 className="text-3xl font-bold text-gray-800">Report Configuration</h1>
                    <button onClick={logout} className={btnDanger} disabled={isFormOpen}>Logout</button>
                </header>

                {/* === Add New Agent Section - RESTORED === */}
                <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Agent</h2>
                    <form onSubmit={handleAddAgent} className="flex items-end space-x-4">
                         <div className="flex-grow">
                            <label htmlFor="agentName" className="block text-sm font-medium text-gray-600 mb-1">Agent Name</label>
                            <input id="agentName" className={inputBase} type="text" placeholder="Enter agent name" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} required disabled={isFormOpen} />
                         </div>
                        <button type="submit" className={btnPrimary} disabled={isFormOpen}>Add Agent</button>
                    </form>
                </section>
                {/* === End Add New Agent Section === */}

                {/* Display Agents and Merchants */}
                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Existing Configurations</h2>
                    {agents.length === 0 && !isFormOpen && ( <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500"> No agents configured yet. Add one above. </div> )}

                    <div className="space-y-6">
                        {agents.map(agent => (
                            <div key={agent.id} id={`agent-section-${agent.id}`} className={`bg-white rounded-lg shadow-md overflow-hidden transition-opacity duration-300 ${isFormOpen && managingMerchantForAgentId !== agent.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                {/* Agent Header */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 flex justify-between items-center border-b border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800">{agent.name}</h3>
                                    <div className="flex space-x-2">
                                        {/* Buttons are now correctly disabled based on 'isFormOpen' */}
                                        <button onClick={() => openAddMerchantForm(agent.id)} className={`${btnPrimary} text-sm`} disabled={isFormOpen}> Add Merchant </button>
                                        <button onClick={() => handleDeleteAgent(agent.id)} className={`${btnDanger} text-sm`} disabled={isFormOpen}> Delete Agent </button>
                                    </div>
                                </div>

                                <div className="p-4 md:p-6">
                                    {/* --- Add/Edit Merchant Form (conditional rendering logic is correct) --- */}
                                    {managingMerchantForAgentId === agent.id && (
                                        <form onSubmit={handleMerchantSubmit} className="bg-blue-50 p-6 rounded-md border border-blue-200 mb-6 space-y-6">
                                            <h4 className="text-lg font-semibold text-blue-800 mb-1">
                                                {isEditing ? `Edit Merchant: ${merchantForm.merchantName || '...'}` : `Add Merchant for ${agent.name}`}
                                            </h4>
                                            {/* General Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Merchant Name</label><input className={inputBase} type="text" name="merchantName" value={merchantForm.merchantName} onChange={handleMerchantInputChange} />{merchantFormErrors.merchantName && <p className={errorText}>{merchantFormErrors.merchantName}</p>}</div>
                                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label><input className={inputBase} type="text" name="merchantTaxId" value={merchantForm.merchantTaxId} onChange={handleMerchantInputChange} maxLength={15} placeholder="xxxx-xxxx-xxxxx" />{merchantFormErrors.merchantTaxId && <p className={errorText}>{merchantFormErrors.merchantTaxId}</p>}</div>
                                                <div><label className="block text-sm font-medium text-gray-700 mb-1">PayCloud ID</label><input className={inputBase} type="text" name="paycloudMerchantId" value={merchantForm.paycloudMerchantId} onChange={handleMerchantInputChange} placeholder="PayCloud M.ID"/>{merchantFormErrors.paycloudMerchantId && <p className={errorText}>{merchantFormErrors.paycloudMerchantId}</p>}</div>
                                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Settlement (T+n)</label><input className={inputBase} type="text" inputMode='numeric' name="settlementDayN" value={merchantForm.settlementDayN} onChange={handleMerchantInputChange} placeholder="e.g., 1"/>{merchantFormErrors.settlementDayN && <p className={errorText}>{merchantFormErrors.settlementDayN}</p>}</div>
                                            </div>
                                            <hr className="my-4 border-blue-200"/>
                                            {/* Tier 1 Fees */}
                                            <div>
                                                <h5 className="text-md font-semibold text-blue-700 mb-2">Tier 1: Service Cost Distribution (%)</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Service Cost</label><input className={inputBase} type="text" inputMode='decimal' name="serviceCostRate" value={merchantForm.serviceCostRate} onChange={handleMerchantInputChange} />{merchantFormErrors.serviceCostRate && <p className={errorText}>{merchantFormErrors.serviceCostRate}</p>}</div>
                                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Agent Share</label><input className={inputBase} type="text" inputMode='decimal' name="agentShareRate" value={merchantForm.agentShareRate} onChange={handleMerchantInputChange} />{merchantFormErrors.agentShareRate && <p className={errorText}>{merchantFormErrors.agentShareRate}</p>}</div>
                                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Flybridge Share</label><input className={inputBase} type="text" inputMode='decimal' name="flybridgeShareRate" value={merchantForm.flybridgeShareRate} onChange={handleMerchantInputChange} />{merchantFormErrors.flybridgeShareRate && <p className={errorText}>{merchantFormErrors.flybridgeShareRate}</p>}</div>
                                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">PayForU Share</label><input className={inputBase} type="text" inputMode='decimal' name="payforuShareRate" value={merchantForm.payforuShareRate} onChange={handleMerchantInputChange} />{merchantFormErrors.payforuShareRate && <p className={errorText}>{merchantFormErrors.payforuShareRate}</p>}</div>
                                                </div>
                                                {merchantFormErrors.tier1SumError && <p className={`${errorText} mt-2 font-semibold`}>{merchantFormErrors.tier1SumError}</p>}
                                            </div>
                                            <hr className="my-4 border-blue-200"/>
                                            {/* Tier 2 Fees */}
                                            <div>
                                                <h5 className="text-md font-semibold text-blue-700 mb-2">Tier 2: PayForU Share Breakdown (%)</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">E-Transfer (IPPS)</label><input className={inputBase} type="text" inputMode='decimal' name="payforuInternalETransferRate" value={merchantForm.payforuInternalETransferRate} onChange={handleMerchantInputChange} />{merchantFormErrors.payforuInternalETransferRate && <p className={errorText}>{merchantFormErrors.payforuInternalETransferRate}</p>}</div>
                                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Overhead Cost</label><input className={inputBase} type="text" inputMode='decimal' name="payforuInternalOverheadRate" value={merchantForm.payforuInternalOverheadRate} onChange={handleMerchantInputChange} />{merchantFormErrors.payforuInternalOverheadRate && <p className={errorText}>{merchantFormErrors.payforuInternalOverheadRate}</p>}</div>
                                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Other Cost</label><input className={inputBase} type="text" inputMode='decimal' name="payforuInternalOtherCostRate" value={merchantForm.payforuInternalOtherCostRate} onChange={handleMerchantInputChange} />{merchantFormErrors.payforuInternalOtherCostRate && <p className={errorText}>{merchantFormErrors.payforuInternalOtherCostRate}</p>}</div>
                                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Profit</label><input className={inputBase} type="text" inputMode='decimal' name="payforuInternalProfitRate" value={merchantForm.payforuInternalProfitRate} onChange={handleMerchantInputChange} />{merchantFormErrors.payforuInternalProfitRate && <p className={errorText}>{merchantFormErrors.payforuInternalProfitRate}</p>}</div>
                                                </div>
                                                {merchantFormErrors.tier2SumError && <p className={`${errorText} mt-2 font-semibold`}>{merchantFormErrors.tier2SumError}</p>}
                                            </div>
                                            {/* Form Actions */}
                                            <div className="flex justify-end space-x-3 pt-4">
                                                <button type="button" onClick={resetAndCloseForm} className={btnSecondary}>Cancel</button>
                                                <button type="submit" className={btnPrimary}>{isEditing ? 'Update Merchant' : 'Save Merchant'}</button>
                                            </div>
                                        </form>
                                    )}
                                    {/* --- End Add/Edit Merchant Form --- */}

                                    {/* --- List Merchants (buttons now correctly disabled) --- */}
                                    {!isFormOpen && agent.merchants.length === 0 && ( <p className="text-sm text-gray-500 italic mt-4"> No merchants added for this agent yet. Click 'Add Merchant' above. </p> )}
                                    {agent.merchants.length > 0 && (
                                        <div className={`mt-6 ${isFormOpen ? 'opacity-50 pointer-events-none' : ''}`}> {/* Dim list when form is open */}
                                            <h4 className="text-md font-semibold text-gray-700 mb-3">Merchants</h4>
                                            <ul className="space-y-4">
                                                {agent.merchants.map(merchant => (
                                                    <li key={merchant.id} className={`border border-gray-200 rounded-lg p-4 transition duration-150 ${isFormOpen ? '' : 'hover:shadow-md'}`}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <strong className="text-gray-900 text-lg block">{merchant.name}</strong>
                                                                <span className="text-xs text-gray-500 block">PayCloud ID: {merchant.paycloudMerchantId || 'N/A'} | Tax ID: {merchant.taxId} | Settlement: T+{merchant.settlementDayN}</span>
                                                            </div>
                                                            <div className='flex flex-col space-y-1 flex-shrink-0 ml-4'>
                                                                {/* Merchant action buttons are disabled if any merchant form is open */}
                                                                <button onClick={() => startEditMerchant(agent.id, merchant)} className={btnSmallEdit} disabled={isFormOpen}>Edit</button>
                                                                <button onClick={() => handleDeleteMerchant(agent.id, merchant.id, merchant.name)} className={btnSmallDanger} disabled={isFormOpen}>Delete</button>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded">
                                                            <p><strong>Total Service Cost:</strong> {merchant.serviceCostRate}%</p>
                                                            <p className="pl-2">↳ Agent: {merchant.agentShareRate}% | Flybridge: {merchant.flybridgeShareRate}% | PayForU: {merchant.payforuShareRate}%</p>
                                                            {merchant.payforuShareRate > 0 && (
                                                                <p className="pl-4">↳ PayForU Breakdown: IPPS: {merchant.payforuInternalETransferRate}% | Overhead: {merchant.payforuInternalOverheadRate}% | Other: {merchant.payforuInternalOtherCostRate}% | Profit: {merchant.payforuInternalProfitRate}%</p>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {/* --- End Merchant List --- */}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}