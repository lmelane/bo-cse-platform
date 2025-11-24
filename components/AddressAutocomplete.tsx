'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  onAddressSelect: (addressData: {
    addressLine1: string;
    postalCode: string;
    city: string;
    region: string;
    country: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
  }) => void;
  defaultValue?: string;
}

export default function AddressAutocomplete({ onAddressSelect, defaultValue }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current) return;
    
    const windowWithGoogle = window as Window & { google?: { maps?: { places?: { Autocomplete: new (input: HTMLInputElement, options: Record<string, unknown>) => unknown } } } };
    if (!windowWithGoogle.google?.maps) return;

    const google = windowWithGoogle.google;
    const autocomplete = new (google.maps as { places: { Autocomplete: new (input: HTMLInputElement, options: Record<string, unknown>) => Record<string, unknown> } }).places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: ['fr', 'be', 'ch', 'lu'] },
      fields: ['address_components', 'formatted_address', 'geometry', 'name'],
    });

    (autocomplete as { addListener: (event: string, callback: () => void) => void }).addListener('place_changed', () => {
      const place = (autocomplete as { getPlace: () => Record<string, unknown> | null }).getPlace();
      
      if (!place || typeof place !== 'object') return;
      
      const placeObj = place as {
        address_components?: Array<{ types: string[]; long_name: string; short_name: string }>;
        formatted_address?: string;
        geometry?: { location: { lat: () => number; lng: () => number } };
      };

      if (!placeObj.address_components || !placeObj.geometry?.location) return;

      let streetNumber = '';
      let route = '';
      let postalCode = '';
      let city = '';
      let region = '';
      let country = '';

      placeObj.address_components.forEach((component) => {
        const types = component.types;

        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        }
        if (types.includes('route')) {
          route = component.long_name;
        }
        if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          region = component.long_name;
        }
        if (types.includes('country')) {
          country = component.long_name;
        }
      });

      const addressLine1 = `${streetNumber} ${route}`.trim();
      const fullAddress = placeObj.formatted_address || addressLine1;
      const latitude = placeObj.geometry.location.lat();
      const longitude = placeObj.geometry.location.lng();

      onAddressSelect({
        addressLine1,
        postalCode,
        city,
        region,
        country,
        fullAddress,
        latitude,
        longitude,
      });
    });
  }, [onAddressSelect]);

  useEffect(() => {
    const windowWithGoogle = window as Window & { google?: { maps?: unknown } };
    
    // Vérifier si Google Maps est déjà chargé
    if (typeof window !== 'undefined' && windowWithGoogle.google?.maps) {
      setIsLoaded(true);
      initAutocomplete();
      return;
    }

    // Vérifier si le script est déjà en train de charger
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script déjà ajouté, attendre qu'il soit chargé
      const checkLoaded = setInterval(() => {
        if (windowWithGoogle.google?.maps) {
          setIsLoaded(true);
          initAutocomplete();
          clearInterval(checkLoaded);
        }
      }, 100);

      return () => clearInterval(checkLoaded);
    }

    // Charger le script Google Maps pour la première fois
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script'; // Ajouter un ID pour éviter les doublons
    script.onload = () => {
      setIsLoaded(true);
      initAutocomplete();
    };

    document.head.appendChild(script);

    // Ne pas retirer le script au cleanup pour éviter de le recharger
  }, []);

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
        <MapPin className="w-5 h-5" />
      </div>
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder="Tapez une adresse (ex: 18 Rue de Navarin, 75009 Paris)..."
        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
      />
      {!isLoaded && (
        <p className="text-xs text-neutral-500 mt-1">
          Chargement de l&apos;autocomplétion...
        </p>
      )}
    </div>
  );
}
