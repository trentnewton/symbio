<!doctype html<?php print $rdf_header; ?>>
<html class="no-js" lang="<?php print $language->language ?>" dir="<?php print $language->dir ?>"<?php print $rdf_namespaces; ?> itemscope itemtype="http://schema.org/WebSite">
	<head<?php print $rdf_profile?>>
	    <title><?php print $head_title; ?></title>
	    <link type="text/plain" rel="author" href="/humans.txt">
		<?php print $head; ?>
		<?php print $styles; ?>
	</head>
	<body class="<?php print $classes; ?>" <?php print $attributes;?> itemscope itemtype="http://schema.org/WebPage">
		<?php include ($directory."/partials/svg.php"); ?>
		<div id="skip-link">
			<a href="#main-content" class="element-invisible element-focusable"><?php print t('Skip to main content'); ?></a>
		</div>
		<?php print $page_top; ?>
		<?php print $page; ?>
		<?php print $scripts; ?>
		<?php print $page_bottom; ?>
	</body>
</html>