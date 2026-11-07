<?php
if(PHP_SAPI!=='cli') { http_response_code(404); exit; }
$root=dirname(__DIR__);$html=file_get_contents($root.'/index.html');
preg_match_all('~<div\b[^>]*class="[^"]*\bjs-item-product\b[^"]*"[^>]*>~',$html,$starts,PREG_OFFSET_CAPTURE);$ranges=[];
foreach($starts[0] as [$tag,$offset]) { $depth=1;$after=$offset+strlen($tag);preg_match_all('~</?div\b[^>]*>~',substr($html,$after),$tags,PREG_OFFSET_CAPTURE);foreach($tags[0] as [$t,$pos]){$depth+=str_starts_with($t,'</')?-1:1;if($depth===0){$ranges[]=[$offset,$after+$pos+strlen($t)-$offset];break;}} }
if(count($ranges)!==count($starts[0]))throw new RuntimeException('Unexpected HTML structure');
foreach(array_reverse($ranges,true) as $i=>[$offset,$length])$html=substr_replace($html,$i===0?'<div id="jg-catalog-grid" class="row" style="width:100%;margin:0" aria-live="polite"></div>':'',$offset,$length);
file_put_contents($root.'/index.html',$html);
$api=file_get_contents($root.'/api/index.php');$start=strpos($api,' // Import the original catalogue');
if($start!==false){$end=strpos($api,' $action=',$start);if($end===false)throw new RuntimeException('Import block missing');$api=substr_replace($api," // Products are managed exclusively through the admin.\n \$db->exec(\"INSERT OR IGNORE INTO categories VALUES('Geral')\");\n",$start,$end-$start);file_put_contents($root.'/api/index.php',$api);}
$db=new PDO('sqlite:'.$root.'/storage/store.sqlite');$db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$db->exec('PRAGMA busy_timeout=5000');$db->exec('DELETE FROM products');
echo 'Static cards removed: '.count($ranges).'; remaining products: '.$db->query('SELECT COUNT(*) FROM products')->fetchColumn().PHP_EOL;
