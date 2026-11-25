'use client';
import { useRouter } from 'next/navigation';
import type {Locale} from '@/lib/i18n';
const labels={en:'Sign out',ar:'تسجيل الخروج',hi:'साइन आउट',bn:'সাইন আউট'} as const;
export default function AdminLogoutButton({locale='en'}:{locale?:Locale}) {
 const router=useRouter();
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.replace(`/${locale}/admin/login`);router.refresh();}
 return <button className="btn secondary" onClick={logout}>{labels[locale]}</button>;
}
