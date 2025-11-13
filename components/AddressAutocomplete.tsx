'use client';

import { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    // Vérifier si Google Maps est déjà chargé
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      setIsLoaded(true);
      initAutocomplete();
      return;
    }

    // Vérifier si le script est déjà en train de charger
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script déjà ajouté, attendre qu'il soit chargé
      const checkLoaded = setInterval(() => {
        if ((window as any).google?.maps) {
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

  const initAutocomplete = () => {
    if (!inputRef.current || !(window as any).google?.maps) return;

    const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: ['fr', 'be', 'ch', 'lu'] }, // France, Belgique, Suisse, Luxembourg
      fields: ['address_components', 'formatted_address', 'geometry', 'name'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.address_components) {
        console.error('No details available for input');
        return;
      }

      // Extraire les composants d'adresse
      let addressLine1 = '';
      let postalCode = '';
      let city = '';
      let region = '';
      let country = '';

      for (const component of place.address_components) {
        const componentType = component.types[0];

        switch (componentType) {
          case 'street_number':
            addressLine1 = component.long_name + ' ' + addressLine1;
            break;
          case 'route':
            addressLine1 += component.long_name;
            break;
          case 'locality':
            city = component.long_name;
            break;
          case 'administrative_area_level_1':
            region = component.long_name;
            break;
          case 'country':
            country = component.long_name;
            break;
          case 'postal_code':
            postalCode = component.long_name;
            break;
        }
      }

      // Si pas de ville dans locality, essayer postal_town
      if (!city) {
        const postalTown = place.address_components.find((c: any) => 
          c.types.includes('postal_town')
        );
        if (postalTown) city = postalTown.long_name;
      }

      const addressData = {
        addressLine1: addressLine1 || place.name || '',
        postalCode,
        city,
        region,
        country,
        fullAddress: place.formatted_address || '',
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      };

      onAddressSelect(addressData);
    });
  };

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
