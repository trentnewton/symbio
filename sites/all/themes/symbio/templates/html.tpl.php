<!DOCTYPE html>
<html class="no-js" lang="<?php print $language->language ?>" dir="<?php print $language->dir ?>" itemscope itemtype="http://schema.org/WebSite">
	<head>
	    <title><?php print $head_title; ?></title>
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