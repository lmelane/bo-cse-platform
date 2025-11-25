'use client';

import React from 'react';
import { X, User, Mail, Briefcase, Calendar, DollarSign, Shield, Link as LinkIcon, Award, TrendingUp, Tag } from 'lucide-react';
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
                className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-brand" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">
                                {user.firstName} {user.lastName}
                            </h2>
                            <p className="text-sm text-neutral-600">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Badges Rôle et Statut */}
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${user.role === 'admin'
                                ? 'bg-brand/10 text-brand'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}>
                            <Shield className="w-4 h-4 mr-2" />
                            {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                        </span>
                        <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${user.onboardingCompleted
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {user.onboardingCompleted ? 'Onboarding complété' : 'Onboarding en cours'}
                        </span>
                    </div>

                    {/* Informations personnelles */}
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-brand" />
                            Informations personnelles
                        </h3>
                        <div className="bg-neutral-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-neutral-600">Email</span>
                                <p className="font-medium text-neutral-900 flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4 text-neutral-400" />
                                    {user.email}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm text-neutral-600">Association</span>
                                <p className="font-medium text-neutral-900">{user.association || 'Non renseignée'}</p>
                            </div>
                            {user.linkedinUrl && (
                                <div className="md:col-span-2">
                                    <span className="text-sm text-neutral-600">LinkedIn</span>
                                    <a
                                        href={user.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-brand hover:underline flex items-center gap-2 mt-1"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        {user.linkedinUrl}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Informations professionnelles */}
                    {(user.currentPosition || user.activitySector || user.positionDuration || user.careerPath || user.interests) && (
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-brand" />
                                Parcours professionnel
                            </h3>
                            <div className="bg-neutral-50 rounded-lg p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.currentPosition && (
                                        <div>
                                            <span className="text-sm text-neutral-600">Poste actuel</span>
                                            <p className="font-medium text-neutral-900">{user.currentPosition}</p>
                                        </div>
                                    )}
                                    {user.activitySector && (
                                        <div>
                                            <span className="text-sm text-neutral-600">Secteur d&apos;activité</span>
                                            <p className="font-medium text-neutral-900">{user.activitySector}</p>
                                        </div>
                                    )}
                                    {user.positionDuration && (
                                        <div>
                                            <span className="text-sm text-neutral-600">Ancienneté au poste</span>
                                            <p className="font-medium text-neutral-900">{getPositionDurationLabel(user.positionDuration)}</p>
                                        </div>
                                    )}
                                </div>

                                {user.careerPath && (
                                    <div>
                                        <span className="text-sm text-neutral-600 block mb-2">Parcours</span>
                                        <p className="text-neutral-900 text-sm leading-relaxed whitespace-pre-wrap bg-white p-3 rounded border border-neutral-200">
                                            {user.careerPath}
                                        </p>
                                    </div>
                                )}

                                {user.interests && user.interests.length > 0 && (
                                    <div>
                                        <span className="text-sm text-neutral-600 block mb-2">Centres d&apos;intérêt</span>
                                        <div className="flex flex-wrap gap-2">
                                            {user.interests.map((interest, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand"
                                                >
                                                    <Tag className="w-3 h-3 mr-1" />
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
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-brand" />
                            Abonnement
                        </h3>
                        <div className="bg-neutral-50 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-neutral-600">Type d&apos;abonnement</span>
                                    <p className="font-medium text-neutral-900">
                                        {user.subscriptionType === 'unlimited' ? 'Adhésion Illimitée' :
                                            user.subscriptionType === 'event_based' ? 'Adhésion Événementielle' :
                                                'Aucun'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-neutral-600">Statut</span>
                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${user.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                            user.subscriptionStatus === 'INACTIVE' ? 'bg-gray-100 text-gray-700' :
                                                user.subscriptionStatus === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                                                    'bg-neutral-100 text-neutral-700'
                                        }`}>
                                        {user.subscriptionStatus === 'ACTIVE' ? 'Actif' :
                                            user.subscriptionStatus === 'INACTIVE' ? 'Inactif' :
                                                user.subscriptionStatus === 'EXPIRED' ? 'Expiré' :
                                                    'Aucun'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-neutral-600">Prix</span>
                                    <p className="font-medium text-neutral-900 flex items-center gap-1">
                                        <DollarSign className="w-4 h-4 text-neutral-400" />
                                        {formatPrice(user.subscriptionPriceCents)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-neutral-600">Période</span>
                                    <p className="text-sm text-neutral-900">
                                        {user.subscriptionStartDate ? formatDate(user.subscriptionStartDate) : '-'}
                                        {' → '}
                                        {user.subscriptionEndDate ? formatDate(user.subscriptionEndDate) : '-'}
                                    </p>
                                </div>
                            </div>

                            {user.stripeCustomerId && (
                                <div className="pt-3 border-t border-neutral-200">
                                    <span className="text-sm text-neutral-600 block mb-2">Identifiants Stripe</span>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-xs text-neutral-500">Customer ID</span>
                                            <p className="text-xs font-mono text-neutral-700 bg-white px-2 py-1 rounded border border-neutral-200 mt-1">
                                                {user.stripeCustomerId}
                                            </p>
                                        </div>
                                        {user.stripeSubscriptionId && (
                                            <div>
                                                <span className="text-xs text-neutral-500">Subscription ID</span>
                                                <p className="text-xs font-mono text-neutral-700 bg-white px-2 py-1 rounded border border-neutral-200 mt-1">
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
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-brand" />
                            Informations système
                        </h3>
                        <div className="bg-neutral-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-neutral-600">Date de création</span>
                                <p className="font-medium text-neutral-900">{formatDate(user.createdAt)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-neutral-600">Dernière mise à jour</span>
                                <p className="font-medium text-neutral-900">{formatDate(user.updatedAt)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-neutral-600">ID Utilisateur</span>
                                <p className="text-xs font-mono text-neutral-700 bg-white px-2 py-1 rounded border border-neutral-200 mt-1">
                                    {user.id}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors font-medium"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
