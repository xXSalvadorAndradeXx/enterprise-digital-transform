import ProductCard from "@/components/products/ProductCard";
import ProductGallery from "@/components/products/ProductGallery";
import ProductOptions from "@/components/products/ProductOptions";
import type { Product, ProductDetailResponse, ProductImage, ProductVariant } from "@/types/products/product.types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const API="http://localhost:3000/api/v1";
const money=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
type Result={status:"success";product:Product;related:Product[]}|{status:"not-found"}|{status:"error"};

async function getData(id:string):Promise<Result>{
  try{
    const [detailResponse,relatedResponse]=await Promise.all([fetch(`${API}/products/${encodeURIComponent(id)}`,{cache:"no-store"}),fetch(`${API}/products/${encodeURIComponent(id)}/related?limit=4`,{cache:"no-store"})]);
    if(detailResponse.status===404)return{status:"not-found"}; if(!detailResponse.ok)return{status:"error"};
    const detail=(await detailResponse.json()) as ProductDetailResponse|{data?:Product}; const product=detail.data;
    if(!product)return{status:"not-found"};
    let related:Product[]=[]; if(relatedResponse.ok){const payload=await relatedResponse.json() as Product[]|{data?:Product[]|{items?:Product[]}};const raw=Array.isArray(payload)?payload:payload.data;related=Array.isArray(raw)?raw:Array.isArray(raw?.items)?raw.items:[];}
    return{status:"success",product,related:related.filter(item=>String(item.id)!==String(product.id)).slice(0,4)};
  }catch{return{status:"error"}}
}

export default async function ProductDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const result=await getData(id);
  if(result.status!=="success")return <section className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-6 text-center"><h1 className="text-3xl font-bold">{result.status==="not-found"?"Producto no encontrado":"No pudimos cargar el producto"}</h1><p className="mt-3 text-slate-600">Verifica el producto o intenta nuevamente.</p><Link href="/productos" className="mt-6 flex items-center gap-2 bg-[#1822d9] px-5 py-3 text-white"><ArrowLeft className="h-4 w-4"/>Volver al catálogo</Link></section>;
  const {product,related}=result;
  const backendProduct=product as unknown as {inventory?:{productName?:string;stock?:string|number;totalStock?:number;details?:Array<{id?:string;sku?:string;size?:string;color?:string;stock?:string|number}>};images?:Array<{id?:string;url?:string;imageUrl?:string;sortOrder?:number}>;variantConfigs?:Array<{id?:string;inventoryDetailId?:string;sku?:string;size?:string;color?:string;stock?:string|number}>};
  const name=product.commercialName??product.nombre??backendProduct.inventory?.productName??"Producto";
  const stock=Number(product.stockTotal??product.stock??backendProduct.inventory?.totalStock??backendProduct.inventory?.stock??0);
  const price=product.effectivePrice??product.precio;const original=product.salePrice;
  const rawDiscount=product.discount as unknown;
  const discountPercentage=typeof rawDiscount==="number"?rawDiscount:(rawDiscount&&typeof rawDiscount==="object"&&"percentage" in rawDiscount?Number((rawDiscount as {percentage?:number}).percentage??0):0);
  const hasActiveDiscount=discountPercentage>0&&Number(price)<Number(original??price);
  const backendImages:ProductImage[]=(backendProduct.images??[]).flatMap((image,index)=>{const url=String(image.url??image.imageUrl??"").trim();return url?[{id:String(image.id??index),url,alt:name,position:image.sortOrder??index}]:[]});
  const images:ProductImage[]=backendImages.length?backendImages:(product.primaryImage?[product.primaryImage]:(product.imagenUrl?[{id:"primary",url:product.imagenUrl,alt:name}]:[]));
  const rawVariants=(backendProduct.variantConfigs?.length?backendProduct.variantConfigs:backendProduct.inventory?.details)??[];
  const inventoryVariants:ProductVariant[]=rawVariants.flatMap((variant,index)=>{const size=String(variant.size??"").trim();const hex=String(variant.color??"").trim();const variantStock=Number(variant.stock??0);if(!size||!hex)return[];return[{id:String(variant.id??index),sku:String(variant.sku??variant.id??index),size,color:{name:hex,hex},stock:variantStock,available:variantStock>0}]});
  const variants=product.variants?.length?product.variants:(inventoryVariants.length?inventoryVariants:[{id:String(product.id),sku:String(product.id),size:"Única",color:{name:"Único",hex:"#E5E7EB"},stock,available:stock>0}]);
  return <main className="mx-auto w-full max-w-[1280px] px-5 py-6 sm:px-8">
    <nav className="bg-[#f2f5fb] px-5 py-4 text-xs text-slate-600">Inicio&nbsp;&nbsp;›&nbsp;&nbsp;Producto&nbsp;&nbsp;›&nbsp;&nbsp;Detalle</nav>
    <header className="border-b border-[#aeb4bd] px-3 pb-8 pt-10 sm:px-4">
      <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl lg:text-5xl">{name}</h1>
      <p className="mt-8 text-sm font-bold text-[#1822d9]">Detalles del producto</p>
    </header>
    <article className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
      <ProductGallery images={images} productName={name}/>
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><span className={`text-3xl font-bold ${hasActiveDiscount?"text-[#ff2d20]":"text-[#1822d9]"}`}>{money.format(Number(price)||0)}</span>{hasActiveDiscount&&original?<><span className="text-base text-slate-600 line-through">{money.format(Number(original)||0)}</span><span className="rounded bg-[#ff3b30] px-2 py-1 text-xs font-bold text-white">-{discountPercentage}%</span></>:null}<span className="rounded-md bg-[#eefaf1] px-3 py-1 text-sm font-semibold text-[#08a637]">{stock} En Stock</span></div>
        <p className="mt-6 leading-7 text-slate-600">{product.descripcion}</p>
        <ProductOptions variants={variants}/>
      </div>
    </article>
    {related.length>0&&<section className="mt-16"><h2 className="text-3xl font-bold">También te puede interesar</h2><div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map(item=><ProductCard key={item.id} product={item}/>)}</div></section>}
  </main>;
}
