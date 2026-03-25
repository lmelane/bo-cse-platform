'use client';

import React from 'react';
import { X, User, Mail, Briefcase, Calendar, DollarSign, Shield, Link as LinkIcon, Award, Tag } from 'lucide-react';
import { User as UserType } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserType | null;
}

export default function UserDetailsModal({
    isOpen,
    onClose,
    user,
}: UserDetailsModalProps) {
    if (!isOpen || !user) return null;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    };

    const formatPrice = (cents: number | null) => {
        if (!cents) return '-';
        return (cents / 100).toFixed(2) + ' €';
    };

    const getPositionDurationLabel = (duration: string | null) => {
        const labels: Record<string, string> = {
            'less_than_1': 'Moins d\'un an',
            '1_to_3': '1 à 3 ans',
            '3_to_5': '3 à 5 ans',
            'more_than_5': 'Plus de 5 ans',
        };
        return duration ? labels[duration] || duration : '-';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div
                className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-brand/5 flex items-center justify-center">
                            <User className="w-4 h-4 text-brand" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-neutral-900">
                                {user.firstName} {user.lastName}
                            </h2>
                            <p className="text-xs text-neutral-500">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4 text-neutral-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Badges Rôle et Statut */}
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${user.role.toLowerCase() === 'admin'
                            ? 'bg-brand/5 text-brand'
                            : 'bg-neutral-100 text-neutral-600'
                            }`}>
                            <Shield className="w-3 h-3 mr-1" />
                            {user.role.toLowerCase() === 'admin' ? 'Administrateur' : 'Utilisateur'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${user.onboardingCompleted
                            ? 'bg-green-50 text-green-700'
                            : 'bg-yellow-50 text-yellow-700'
                            }`}>
                            {user.onboardingCompleted ? 'Onboarding complété' : 'Onboarding en cours'}
                        </span>
                    </div>

                    {/* Informations personnelles */}
                    <div>
                        <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-brand" />
                            Informations personnelles
                        </h3>
                        <div className="bg-neutral-50 rounded-md p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <span className="text-[11px] text-neutral-500">Email</span>
                                <p className="text-sm font-medium text-neutral-900 flex items-center gap-1.5 mt-0.5">
                                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                                    {user.email}
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] text-neutral-500">Association</span>
                                <p className="text-sm font-medium text-neutral-900">{user.association || 'Non renseignée'}</p>
                            </div>
                            {user.linkedinUrl && (
                                <div className="md:col-span-2">
                                    <span className="text-[11px] text-neutral-500">LinkedIn</span>
                                    <a
                                        href={user.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-brand hover:underline flex items-center gap-1.5 mt-0.5"
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        {user.linkedinUrl}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Informations professionnelles */}
                    {(user.currentPosition || user.activitySector || user.positionDuration || user.careerPath || user.interests) && (
                        <div>
                            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-brand" />
                                Parcours professionnel
                            </h3>
                            <div className="bg-neutral-50 rounded-md p-3 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {user.currentPosition && (
                                        <div>
                                            <span className="text-[11px] text-neutral-500">Poste actuel</span>
                                            <p className="text-sm font-medium text-neutral-900">{user.currentPosition}</p>
                                        </div>
                                    )}
                                    {user.activitySector && (
                                        <div>
                                            <span className="text-[11px] text-neutral-500">Secteur d&apos;activité</span>
                                            <p className="text-sm font-medium text-neutral-900">{user.activitySector}</p>
                                        </div>
                                    )}
                                    {user.positionDuration && (
                                        <div>
                                            <span className="text-[11px] text-neutral-500">Ancienneté au poste</span>
                                            <p className="text-sm font-medium text-neutral-900">{getPositionDurationLabel(user.positionDuration)}</p>
                                        </div>
                                    )}
                                </div>

                                {user.careerPath && (
                                    <div>
                                        <span className="text-[11px] text-neutral-500 block mb-1">Parcours</span>
                                        <p className="text-neutral-900 text-xs leading-relaxed whitespace-pre-wrap bg-white p-2.5 rounded-md border border-neutral-200">
                                            {user.careerPath}
                                        </p>
                                    </div>
                                )}

                                {user.interests && Array.isArray(user.interests) && user.interests.length > 0 && (
                                    <div>
                                        <span className="text-[11px] text-neutral-500 block mb-1">Centres d&apos;intérêt</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {user.interests.map((interest, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-brand/5 text-brand"
                                                >
                                                    <Tag className="w-2.5 h-2.5 mr-1" />
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Abonnement */}
                    <div>
                        <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-brand" />
                            Abonnement
                        </h3>
                        <div className="bg-neutral-50 rounded-md p-3 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <span className="text-[11px] text-neutral-500">Type d&apos;abonnement</span>
                                    <p className="text-sm font-medium text-neutral-900">
                                        {user.subscriptionType === 'unlimited' ? 'Adhésion Illimitée' :
                                            user.subscriptionType === 'event_based' ? 'Adhésion Événementielle' :
                                                'Aucun'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-neutral-500">Statut</span>
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${user.subscriptionStatus === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                                        user.subscriptionStatus === 'INACTIVE' ? 'bg-gray-100 text-gray-600' :
                                            user.subscriptionStatus === 'EXPIRED' ? 'bg-red-50 text-red-700' :
                                                'bg-neutral-100 text-neutral-600'
                                        }`}>
                                        {user.subscriptionStatus === 'ACTIVE' ? 'Actif' :
                                            user.subscriptionStatus === 'INACTIVE' ? 'Inactif' :
                                                user.subscriptionStatus === 'EXPIRED' ? 'Expiré' :
                                                    'Aucun'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-neutral-500">Prix</span>
                                    <p className="text-sm font-medium text-neutral-900 flex items-center gap-1">
                                        <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
                                        {formatPrice(user.subscriptionPriceCents)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-neutral-500">Période</span>
                                    <p className="text-xs text-neutral-900">
                                        {user.subscriptionStartDate ? formatDate(user.subscriptionStartDate) : '-'}
                                        {' → '}
                                        {user.subscriptionEndDate ? formatDate(user.subscriptionEndDate) : '-'}
                                    </p>
                                </div>
                            </div>

                            {user.stripeCustomerId && (
                                <div className="pt-2.5 border-t border-neutral-200">
                                    <span className="text-[11px] text-neutral-500 block mb-1.5">Identifiants Stripe</span>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-[10px] text-neutral-400">Customer ID</span>
                                            <p className="text-[11px] font-mono text-neutral-600 bg-white px-2 py-1 rounded border border-neutral-200 mt-0.5">
                                                {user.stripeCustomerId}
                                            </p>
                                        </div>
                                        {user.stripeSubscriptionId && (
                                            <div>
                                                <span className="text-[10px] text-neutral-400">Subscription ID</span>
                                                <p className="text-[11px] font-mono text-neutral-600 bg-white px-2 py-1 rounded border border-neutral-200 mt-0.5">
                                                    {user.stripeSubscriptionId}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dates système */}
                    <div>
                        <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-brand" />
                            Informations système
                        </h3>
                        <div className="bg-neutral-50 rounded-md p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <span className="text-[11px] text-neutral-500">Date de création</span>
                                <p className="text-sm font-medium text-neutral-900">{formatDate(user.createdAt)}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-neutral-500">Dernière mise à jour</span>
                                <p className="text-sm font-medium text-neutral-900">{formatDate(user.updatedAt)}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-neutral-500">ID Utilisateur</span>
                                <p className="text-[11px] font-mono text-neutral-600 bg-white px-2 py-1 rounded border border-neutral-200 mt-0.5">
                                    {user.id}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-4 py-3 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-xs bg-brand text-white rounded-md hover:bg-brand-dark transition-colors font-medium"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
