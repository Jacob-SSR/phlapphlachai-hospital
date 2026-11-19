'use client';
import {MapContainer,TileLayer,CircleMarker,Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
export default function HospitalMap(){
 const lat=Number(process.env.NEXT_PUBLIC_HOSPITAL_LAT),lng=Number(process.env.NEXT_PUBLIC_HOSPITAL_LNG);
 const verified=Boolean(process.env.NEXT_PUBLIC_HOSPITAL_LAT&&process.env.NEXT_PUBLIC_HOSPITAL_LNG)&&Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180;
 return <><MapContainer center={verified?[lat,lng]:[15.3,101]} zoom={verified?15:5} scrollWheelZoom={false} className="hospital-map" aria-label="แผนที่โรงพยาบาล"><TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' maxZoom={19}/>{verified&&<CircleMarker center={[lat,lng]} radius={12} pathOptions={{color:'#fff',weight:3,fillColor:'#00796b',fillOpacity:1}}><Popup>โรงพยาบาลพลับพลาชัย</Popup></CircleMarker>}</MapContainer>{!verified&&<div className="map-pending">แผนที่ภาพรวม • รอยืนยันพิกัดโรงพยาบาล</div>}</>;
}
