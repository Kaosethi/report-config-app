// src/app/(auth)/config/page.tsx
'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth, AuthContextType } from '@/context/AuthContext';
import { formatTaxId, validateTaxId } from '@/lib/utils';

// --- Interfaces ---
interface Merchant {
    id: string;
    name: string;
    taxId: string;
    mdrRate: number;
    agentSettlementRatePercent: number;
    flybridgeRatePercent: number;
    ippsRatePercent: number;
    settlementDayN: number;
    paycloudMerchantId: string;
}
interface Agent { id: string; name: string; merchants: Merchant[]; }
interface MerchantFormData {
    merchantName: string;
    merchantTaxId: string;
    mdrRate: string;
    agentSettlementRatePercent: string;
    flybridgeRatePercent: string;
    ippsRatePercent: string;
    settlementDayN: string;
    paycloudMerchantId: string;
}
interface MerchantFormErrors {
    merchantName?: string;
    merchantTaxId?: string;
    mdrRate?: string;
    agentSettlementRatePercent?: string;
    flybridgeRatePercent?: string;
    ippsRatePercent?: string;
    settlementDayN?: string;
    paycloudMerchantId?: string;
    totalPercent?: string;
}

// --- Main Component ---
export default function ConfigPage() {
    const auth: AuthContextType = useAuth();
    const { logout } = auth;

    // --- State ---
    const [agents, setAgents] = useState<Agent[]>([]);
    const [newAgentName, setNewAgentName] = useState<string>('');
    const [managingMerchantForAgentId, setManagingMerchantForAgentId] = useState<string | null>(null);
    const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
    const [merchantForm, setMerchantForm] = useState<MerchantFormData>({
        merchantName: '', merchantTaxId: '', mdrRate: '',
        agentSettlementRatePercent: '', flybridgeRatePercent: '', ippsRatePercent: '',
        settlementDayN: '', paycloudMerchantId: ''
    });
    const [merchantFormErrors, setMerchantFormErrors] = useState<MerchantFormErrors>({});
    const [isLoaded, setIsLoaded] = useState(false);

    const isFormOpen = !!managingMerchantForAgentId;
    const isEditing = isFormOpen && !!editingMerchantId;

    // --- Effects ---
    useEffect(() => {
        console.log("Attempting to load data from localStorage...");
        try {
            const storedData = localStorage.getItem('reportConfigData');
            if (storedData) {
                console.log("Found stored data");
                const parsedData: Agent[] = JSON.parse(storedData);
                if (Array.isArray(parsedData)) {
                    const validatedData = parsedData.map(agent => ({
                        ...agent,
                        merchants: agent.merchants.map(merchant => ({
                            ...merchant,
                            settlementDayN: typeof merchant.settlementDayN === 'number' ? merchant.settlementDayN : 1, // Default
                            paycloudMerchantId: typeof merchant.paycloudMerchantId === 'string' ? merchant.paycloudMerchantId : '' // Default
                        }))
                    }));
                    setAgents(validatedData);
                    console.log("Successfully loaded agents:", validatedData);
                } else {
                    console.error("Stored data is not an array:", parsedData);
                    localStorage.removeItem('reportConfigData');
                }
            } else {
                 console.log("No data found in localStorage.");
            }
        } catch (error) {
            console.error("Error parsing stored config data:", error);
            localStorage.removeItem('reportConfigData');
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (isLoaded) {
            console.log("Saving agents to localStorage:", agents);
            try {
                 localStorage.setItem('reportConfigData', JSON.stringify(agents));
            } catch(error) {
                 console.error("Error saving data to localStorage:", error);
            }
        }
    }, [agents, isLoaded]);

    // --- Agent Handling ---
    const handleAddAgent = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newAgentName.trim()) return;
        const newAgent: Agent = { id: Date.now().toString(), name: newAgentName.trim(), merchants: [] };
        setAgents(prevAgents => [...prevAgents, newAgent]);
        setNewAgentName('');
    };
    const handleDeleteAgent = (agentIdToDelete: string) => {
        const agentName = agents.find(a => a.id === agentIdToDelete)?.name || 'this agent';
        if (window.confirm(`Are you sure you want to delete agent "${agentName}" and all associated merchants? This cannot be undone.`)) {
            setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentIdToDelete));
        }
     };

    // --- Merchant Form & CRUD ---
    const handleMerchantInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const fieldName = name as keyof MerchantFormData;
        let processedValue = value;

        if (fieldName === 'merchantTaxId') { processedValue = formatTaxId(value); }
        else if (fieldName === 'settlementDayN') { processedValue = value.replace(/\D/g, ''); }
        else if (['mdrRate', 'agentSettlementRatePercent', 'flybridgeRatePercent', 'ippsRatePercent'].includes(fieldName)) {
            const numericValue = value.replace(/[^0-9.]/g, '');
            const parts = numericValue.split('.');
            processedValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : numericValue;
        }
        setMerchantForm(prevForm => ({ ...prevForm, [fieldName]: processedValue }));
        if (merchantFormErrors[fieldName]) { setMerchantFormErrors(prevErrors => ({ ...prevErrors, [fieldName]: undefined })); }
    };

    const validateMerchantForm = (): boolean => {
        const errors: MerchantFormErrors = {};
        if (!merchantForm.merchantName.trim()) errors.merchantName = 'Merchant Name is required.';
        if (!validateTaxId(merchantForm.merchantTaxId)) errors.merchantTaxId = 'Invalid Tax ID (xxxx-xxxx-xxxxx).';
        const mdr = parseFloat(merchantForm.mdrRate);
        if (isNaN(mdr) || mdr < 0) errors.mdrRate = 'Valid MDR Rate (%) is required.';
        const agentPercent = parseFloat(merchantForm.agentSettlementRatePercent);
        if (isNaN(agentPercent) || agentPercent < 0) errors.agentSettlementRatePercent = 'Valid Agent Rate (% of MDR) is required.';
        const flyPercent = parseFloat(merchantForm.flybridgeRatePercent);
        if (isNaN(flyPercent) || flyPercent < 0) errors.flybridgeRatePercent = 'Valid Flybridge Rate (% of MDR) is required.';
        const ippsPercent = parseFloat(merchantForm.ippsRatePercent);
        if (isNaN(ippsPercent) || ippsPercent < 0) errors.ippsRatePercent = 'Valid IPPS Rate (% of MDR) is required.';
        const settlementN = parseInt(merchantForm.settlementDayN, 10);
        if (isNaN(settlementN) || settlementN < 0) errors.settlementDayN = 'Settlement Day (n) must be a non-negative number.';
        if (!merchantForm.paycloudMerchantId.trim()) errors.paycloudMerchantId = 'PayCloud Merchant ID is required.'; // Example: Make it required

        setMerchantFormErrors(errors);
        return Object.keys(errors).length === 0;
     };

    const resetAndCloseForm = () => {
         setManagingMerchantForAgentId(null);
         setEditingMerchantId(null);
         setMerchantForm({
             merchantName: '', merchantTaxId: '', mdrRate: '',
             agentSettlementRatePercent: '', flybridgeRatePercent: '', ippsRatePercent: '',
             settlementDayN: '', paycloudMerchantId: ''
         });
         setMerchantFormErrors({});
    };

    const handleMerchantSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateMerchantForm() || !managingMerchantForAgentId) return;

        const merchantDataFromForm: Omit<Merchant, 'id'> = {
            name: merchantForm.merchantName.trim(),
            taxId: merchantForm.merchantTaxId,
            mdrRate: parseFloat(merchantForm.mdrRate),
            agentSettlementRatePercent: parseFloat(merchantForm.agentSettlementRatePercent),
            flybridgeRatePercent: parseFloat(merchantForm.flybridgeRatePercent),
            ippsRatePercent: parseFloat(merchantForm.ippsRatePercent),
            settlementDayN: parseInt(merchantForm.settlementDayN, 10),
            paycloudMerchantId: merchantForm.paycloudMerchantId.trim()
        };

        if (isEditing && editingMerchantId) { // Update Logic
            setAgents(prevAgents => prevAgents.map(agent => {
                if (agent.id === managingMerchantForAgentId) {
                    const updatedMerchants = agent.merchants.map(merchant =>
                        merchant.id === editingMerchantId
                            ? { ...merchant, ...merchantDataFromForm }
                            : merchant
                    );
                    return { ...agent, merchants: updatedMerchants };
                }
                return agent;
            }));
            console.log("Updated merchant:", editingMerchantId);
        } else { // Add Logic
            const newMerchant: Merchant = {
                ...merchantDataFromForm,
                id: Date.now().toString(),
            };
            setAgents(prevAgents => prevAgents.map(agent =>
                agent.id === managingMerchantForAgentId
                    ? { ...agent, merchants: [...agent.merchants, newMerchant] }
                    : agent
            ));
            console.log("Added new merchant:", newMerchant);
        }
        resetAndCloseForm();
    };

    const startEditMerchant = (agentId: string, merchant: Merchant) => {
         setManagingMerchantForAgentId(agentId);
         setEditingMerchantId(merchant.id);
         setMerchantForm({
             merchantName: merchant.name,
             merchantTaxId: merchant.taxId,
             mdrRate: String(merchant.mdrRate),
             agentSettlementRatePercent: String(merchant.agentSettlementRatePercent),
             flybridgeRatePercent: String(merchant.flybridgeRatePercent),
             ippsRatePercent: String(merchant.ippsRatePercent),
             settlementDayN: String(merchant.settlementDayN),
             paycloudMerchantId: merchant.paycloudMerchantId || ''
         });
         setMerchantFormErrors({});
     };

    const openAddMerchantForm = (agentId: string) => {
         setManagingMerchantForAgentId(agentId);
         setEditingMerchantId(null);
         setMerchantForm({
            merchantName: '', merchantTaxId: '', mdrRate: '',
            agentSettlementRatePercent: '', flybridgeRatePercent: '', ippsRatePercent: '',
            settlementDayN: '', paycloudMerchantId: ''
         });
         setMerchantFormErrors({});
     };

    const handleDeleteMerchant = (agentId: string, merchantIdToDelete: string, merchantName: string) => {
         if (window.confirm(`Are you sure you want to delete merchant "${merchantName}"? This cannot be undone.`)) {
            setAgents(prevAgents => prevAgents.map(agent => {
                 if (agent.id === agentId) {
                     const updatedMerchants = agent.merchants.filter(merchant => merchant.id !== merchantIdToDelete);
                     return { ...agent, merchants: updatedMerchants };
                 }
                 return agent;
            }));
            if(editingMerchantId === merchantIdToDelete) {
                resetAndCloseForm();
            }
        }
    };

    // --- Styles ---
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
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-300">
                    <h1 className="text-3xl font-bold text-gray-800">Report Configuration</h1>
                    <button onClick={logout} className={btnDanger} disabled={isFormOpen}>Logout</button>
                </header>

                {/* Add New Agent Section */}
                <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Agent</h2>
                    <form onSubmit={handleAddAgent} className="flex items-end space-x-4">
                         <div className="flex-grow"><label htmlFor="agentName" className="block text-sm font-medium text-gray-600 mb-1">Agent Name</label><input id="agentName" className={inputBase} type="text" placeholder="Enter agent name" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} required disabled={isFormOpen} /></div>
                        <button type="submit" className={btnPrimary} disabled={isFormOpen}>Add Agent</button>
                    </form>
                </section>

                {/* Display Agents and Merchants */}
                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Existing Configurations</h2>
                    {agents.length === 0 && !isFormOpen && ( <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500"> No agents configured yet. </div> )}

                    <div className="space-y-6">
                        {agents.map(agent => (
                            <div key={agent.id} id={`agent-section-${agent.id}`} className={`bg-white rounded-lg shadow-md overflow-hidden ${isFormOpen && managingMerchantForAgentId !== agent.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                {/* Agent Header */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 flex justify-between items-center border-b border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800">{agent.name}</h3>
                                    <div className="flex space-x-2">
                                        <button onClick={() => openAddMerchantForm(agent.id)} className={`${btnPrimary} text-sm`} disabled={isFormOpen}> Add Merchant </button>
                                        <button onClick={() => handleDeleteAgent(agent.id)} className={`${btnDanger} text-sm`} disabled={isFormOpen}> Delete Agent </button>
                                    </div>
                                </div>

                                <div className="p-4 md:p-6">
                                    {/* --- Add/Edit Merchant Form --- */}
                                    {managingMerchantForAgentId === agent.id && (
                                        <form onSubmit={handleMerchantSubmit} className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6 space-y-4">
                                            <h4 className="text-md font-semibold text-blue-800 mb-3">
                                                {isEditing ? `Edit Merchant Details for ${merchantForm.merchantName || '...'}` : `Add Merchant Details for ${agent.name}`}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                                                <div className="md:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1">Merchant Name</label><input className={inputBase} type="text" name="merchantName" value={merchantForm.merchantName} onChange={handleMerchantInputChange} />{merchantFormErrors.merchantName && <p className={errorText}>{merchantFormErrors.merchantName}</p>}</div>
                                                <div className="md:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1">Merchant Tax ID</label><input className={inputBase} type="text" name="merchantTaxId" value={merchantForm.merchantTaxId} onChange={handleMerchantInputChange} maxLength={15} placeholder="xxxx-xxxx-xxxxx" />{merchantFormErrors.merchantTaxId && <p className={errorText}>{merchantFormErrors.merchantTaxId}</p>}</div>
                                                <div className="md:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1">MDR Rate (%)</label><input className={inputBase} type="text" inputMode='decimal' name="mdrRate" value={merchantForm.mdrRate} onChange={handleMerchantInputChange} placeholder="e.g., 2.5" />{merchantFormErrors.mdrRate && <p className={errorText}>{merchantFormErrors.mdrRate}</p>}</div>
                                                <div className="md:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1">Agent Rate (% MDR)</label><input className={inputBase} type="text" inputMode='decimal' name="agentSettlementRatePercent" value={merchantForm.agentSettlementRatePercent} onChange={handleMerchantInputChange} placeholder="e.g., 70" />{merchantFormErrors.agentSettlementRatePercent && <p className={errorText}>{merchantFormErrors.agentSettlementRatePercent}</p>}</div>
                                                <div className="md:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1">Flybridge Rate (% MDR)</label><input className={inputBase} type="text" inputMode='decimal' name="flybridgeRatePercent" value={merchantForm.flybridgeRatePercent} onChange={handleMerchantInputChange} placeholder="e.g., 10" />{merchantFormErrors.flybridgeRatePercent && <p className={errorText}>{merchantFormErrors.flybridgeRatePercent}</p>}</div>
                                                <div className="md:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1">IPPS Rate (% MDR)</label><input className={inputBase} type="text" inputMode='decimal' name="ippsRatePercent" value={merchantForm.ippsRatePercent} onChange={handleMerchantInputChange} placeholder="e.g., 5"/>{merchantFormErrors.ippsRatePercent && <p className={errorText}>{merchantFormErrors.ippsRatePercent}</p>}</div>
                                                <div className="md:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1">Settlement Day (T+n)</label><input className={inputBase} type="text" inputMode='numeric' name="settlementDayN" value={merchantForm.settlementDayN} onChange={handleMerchantInputChange} placeholder="e.g., 1 for T+1"/>{merchantFormErrors.settlementDayN && <p className={errorText}>{merchantFormErrors.settlementDayN}</p>}</div>
                                                <div className="md:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1">PayCloud Merchant ID</label><input className={inputBase} type="text" name="paycloudMerchantId" value={merchantForm.paycloudMerchantId} onChange={handleMerchantInputChange} placeholder="Enter PayCloud ID"/>{merchantFormErrors.paycloudMerchantId && <p className={errorText}>{merchantFormErrors.paycloudMerchantId}</p>}</div>
                                            </div>
                                            {merchantFormErrors.totalPercent && <p className={errorText}>{merchantFormErrors.totalPercent}</p>}
                                            <div className="flex justify-end space-x-3 pt-2">
                                                <button type="button" onClick={resetAndCloseForm} className={btnSecondary}>Cancel</button>
                                                <button type="submit" className={btnPrimary}>{isEditing ? 'Update Merchant' : 'Save Merchant'}</button>
                                            </div>
                                        </form>
                                    )}
                                    {/* --- End Add/Edit Merchant Form --- */}

                                    {/* --- List Merchants --- */}
                                    {!isFormOpen && agent.merchants.length === 0 && ( <p className="text-sm text-gray-500 italic mt-4"> No merchants added yet. </p> )}

                                    {agent.merchants.length > 0 && (
                                        <div className={isFormOpen ? 'opacity-50' : ''}>
                                            <h4 className="text-md font-semibold text-gray-600 mb-3 mt-4">Merchants</h4>
                                            <ul className="space-y-3">
                                                {agent.merchants.map(merchant => (
                                                    <li key={merchant.id} className={`flex justify-between items-start border border-gray-200 rounded p-3 transition duration-150 ${isFormOpen ? '' : 'hover:bg-gray-100'}`}>
                                                        <div className='flex-grow mr-4'>
                                                            <strong className="text-gray-800 block">{merchant.name}</strong>
                                                            <span className="text-xs text-gray-500 block">PayCloud ID: {merchant.paycloudMerchantId || 'N/A'}</span>
                                                            <span className="text-xs text-gray-500 block">Tax ID: {merchant.taxId}</span>
                                                            <div className="text-xs text-gray-600 mt-1">
                                                                 <span title="MDR Rate">MDR: {merchant.mdrRate}%</span> |{' '}
                                                                 <span title="Agent Settlement Rate (% of MDR)">Agent: {merchant.agentSettlementRatePercent}%</span> |{' '}
                                                                 <span title="Flybridge Rate (% of MDR)">Flybridge: {merchant.flybridgeRatePercent}%</span> |{' '}
                                                                 <span title="IPPS Rate (% of MDR)">IPPS: {merchant.ippsRatePercent}%</span> |{' '}
                                                                 <span title="Settlement Day (T+n)">Settlement: T+{merchant.settlementDayN}</span>
                                                            </div>
                                                        </div>
                                                        <div className='flex flex-col space-y-1 flex-shrink-0'>
                                                            <button onClick={() => startEditMerchant(agent.id, merchant)} className={btnSmallEdit} title={`Edit merchant ${merchant.name}`} disabled={isFormOpen}> Edit </button>
                                                            <button onClick={() => handleDeleteMerchant(agent.id, merchant.id, merchant.name)} className={btnSmallDanger} title={`Delete merchant ${merchant.name}`} disabled={isFormOpen}> Delete </button>
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