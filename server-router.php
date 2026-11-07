<?php
// Access rules for PHP's local development server (it ignores .htaccess).
$path=rawurldecode(parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH)??'/');
if(preg_match('~(?:^|/)(?:\.[^/]*|storage|tests)(?:/|$)~i',$path) || str_contains($path,'..') || preg_match('~\.(?:md|ini|log|sqlite|zip|ps1)$~i',$path) || preg_match('~^/admin/(?:initial-admin|create-admin)\.php~i',$path)) {
 http_response_code(404); exit('Não encontrado');
}
if(str_starts_with($path,'/uploads/')&&!preg_match('~^/uploads/[a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp)$~i',$path)){http_response_code(404);exit;}
return false;
