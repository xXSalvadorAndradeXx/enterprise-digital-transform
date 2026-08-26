import ProductCard from "@/components/products/ProductCard";
import ProductGallery from "@/components/products/ProductGallery";
import ProductOptions from "@/components/products/ProductOptions";
import type { Product, ProductImage, ProductVariant } from "@/types/products/product.types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const API="http://localhost:3000/api/v1";
const money=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
type Result={status:"success";product:Product;related:Product[]}|{status:"not-found"}|{status:"error"};

function extractProducts(payload:unknown):Product[]{
  if(payload&&typeof payload==="object"&&"success" in payload&&(payload as {success?:unknown}).success===true&&"data" in payload){
    return extractProducts((payload as {data?:unknown}).data);
  }
  if(Array.isArray(payload))return payload as Product[];
  if(!payload||typeof payload!=="object"||!("data" in payload))return[];
  const data=(payload as {data?:unknown}).data;
  if(Array.isArray(data))return data as Product[];
  if(data&&typeof data==="object"&&"items" in data&&Array.isArray((data as {items?:unknown}).items))return (data as {items:Product[]}).items;
  return[];
}

async function getData(id:string):Promise<Result>{
  try{
    const detailResponse=await fetch(`${API}/ecommerce/products/${encodeURIComponent(id)}`,{cache:"no-store"});
    if(detailResponse.status===404)return{status:"not-found"}; if(!detailResponse.ok)return{status:"error"};
    const rawDetail=await detailResponse.json() as unknown;
    let detail:unknown=rawDetail;
    if(detail&&typeof detail==="object"&&"success" in detail&&(detail as {success?:unknown}).success===true&&"data" in detail){detail=(detail as {data?:unknown}).data}
    if(detail&&typeof detail==="object"&&!Array.isArray(detail)&&!("id" in detail)&&"data" in detail){detail=(detail as {data?:unknown}).data}
    if(!detail||typeof detail!=="object"||!("id" in detail))return{status:"not-found"};
    const product=detail as Product;
    let related:Product[]=[];
    try{
      const relatedResponse=await fetch(`${API}/ecommerce/products/${encodeURIComponent(id)}/related?limit=4`,{cache:"no-store"});
      if(relatedResponse.ok)related=extractProducts(await relatedResponse.json());
    }catch{}
    if(related.length===0){
      const rawProduct=product as unknown as {inventory?:{categoryId?:number;category?:{id?:number}}};
      const categoryId=rawProduct.inventory?.categoryId??rawProduct.inventory?.category?.id;
      const query=new URLSearchParams({page:"1",limit:"5",sortBy:"createdAt",order:"DESC"});
      if(categoryId)query.set("categoryId",String(categoryId));
      try{
        const fallbackResponse=await fetch(`${API}/products?${query.toString()}`,{cache:"no-store"});
        if(fallbackResponse.ok)related=extractProducts(await fallbackResponse.json());
      }catch{}
    }
    return{status:"success",product,related:related.filter(item=>String(item.id)!==String(product.id)).slice(0,4)};
  }catch{return{status:"error"}}
}

export default async function ProductDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const result=await getData(id);
  if(result.status!=="success")return <section className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-6 text-center"><h1 className="text-3xl font-bold">{result.status==="not-found"?"Producto no encontrado":"No pudimos cargar el producto"}</h1><p className="mt-3 text-slate-600">Verifica el producto o intenta nuevamente.</p><Link href="/productos" className="mt-6 flex items-center gap-2 bg-[#1822d9] px-5 py-3 text-white"><ArrowLeft className="h-4 w-4"/>Volver al catálogo</Link></section>;
  const {product,related}=result;
  const backendProduct=product as unknown as {inventory?:{productName?:string;stock?:string|number;totalStock?:number};images?:Array<string|{id?:string;url?:string;imageUrl?:string;sortOrder?:number}>};
  const name=product.commercialName??product.nombre??backendProduct.inventory?.productName??"Producto";
  const stock=Number(product.stockTotal??product.stock??backendProduct.inventory?.totalStock??backendProduct.inventory?.stock??0);
  const price=product.effectivePrice??product.precio;const original=product.salePrice;
  const rawDiscount=product.discount as unknown;
  const discountPercentage=typeof rawDiscount==="number"?rawDiscount:(rawDiscount&&typeof rawDiscount==="object"&&"percentage" in rawDiscount?Number((rawDiscount as {percentage?:number}).percentage??0):0);
  const hasActiveDiscount=discountPercentage>0&&Number(price)<Number(original??price);
  const backendImages:ProductImage[]=(backendProduct.images??[]).flatMap((image,index)=>{const url=typeof image==="string"?image:String(image.url??image.imageUrl??"").trim();return url?[{id:typeof image==="string"?String(index):String(image.id??index),url,alt:name,position:typeof image==="string"?index:image.sortOrder??index}]:[]});
  const primaryImage=typeof product.primaryImage==="string"?{id:"primary",url:product.primaryImage,alt:name}:product.primaryImage;
  const images:ProductImage[]=backendImages.length?backendImages:(primaryImage?[primaryImage]:(product.imagenUrl?[{id:"primary",url:product.imagenUrl,alt:name}]:[]));
  const rawVariants=(product.variants??[]) as unknown as Array<{id?:string;sku?:string;size?:string;color?:string|{name?:string;hex?:string};stock?:string|number;available?:boolean;stockStatus?:string}>;
  const variants:ProductVariant[]=rawVariants.flatMap((variant,index)=>{const size=String(variant.size??"").trim();const rawColor=variant.color;const hex=typeof rawColor==="string"?rawColor.trim():String(rawColor?.hex??"").trim();const colorName=typeof rawColor==="string"?rawColor:String(rawColor?.name??hex);const variantStock=Number(variant.stock??0);if(!size||!hex)return[];return[{id:String(variant.id??index),sku:String(variant.sku??variant.id??index),size,color:{name:colorName,hex},stock:variantStock,available:variant.available??(variant.stockStatus!=="OUT_OF_STOCK"&&variantStock>0)}]});
  return <main className="mx-auto w-full max-w-[1280px] px-5 py-6 sm:px-8">
    <nav className="bg-[#f2f5fb] px-5 py-4 text-xs text-slate-600">Inicio&nbsp;&nbsp;›&nbsp;&nbsp;Producto&nbsp;&nbsp;›&nbsp;&nbsp;Detalle</nav>
    <header className="border-b border-[#aeb4bd] px-3 pb-8 pt-10 sm:px-4">
      <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl lg:text-5xl">{name}</h1>
      <p className="mt-8 text-sm font-bold text-[#1822d9]">Detalles del producto</p>
    </header>
    <article className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
      <ProductGallery images={images} productName={name}/>
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><span className={`text-3xl font-bold ${hasActiveDiscount?"text-[#ff2d20]":"text-[#1822d9]"}`}>{money.format(Number(price)||0)}</span>{hasActiveDiscount&&original?<><span className="text-base text-slate-600 line-through">{money.format(Number(original)||0)}</span><span className="rounded bg-[#ff3b30] px-2 py-1 text-xs font-bold text-white">-{discountPercentage}%</span></>:null}<span className="rounded-md bg-[#eefaf1] px-3 py-1 text-sm font-semibold text-[#08a637]">{stock} En Stock</span></div>
        <p className="mt-6 leading-7 text-slate-600">{product.description??product.descripcion}</p>
        <ProductOptions product={product} variants={variants}/>
      </div>
    </article>
    {related.length>0&&<section className="mt-16"><h2 className="text-3xl font-bold">También te puede interesar</h2><div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map(item=><ProductCard key={item.id} product={item}/>)}</div></section>}
  </main>;
}
